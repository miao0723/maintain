// backend/routes/locationRoutes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * 根据IP获取大致位置
 * 优先使用高德地图IP定位API，回退到ip-api.com
 */
router.get('/ip-location', async (req, res) => {
  try {
    // 尝试获取客户端IP
    let clientIp = req.query.ip;

    if (!clientIp) {
      // 从各种可能的请求头中获取IP
      const headers = req.headers;
      clientIp = headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                  headers['x-real-ip'] ||
                  headers['cf-connecting-ip'] ||
                  req.connection.remoteAddress ||
                  req.socket.remoteAddress;
    }

    // 如果没有获取到IP，尝试使用API自身的IP
    if (!clientIp || clientIp === '::1' || clientIp === '127.0.0.1' || (clientIp.includes && clientIp.includes('::ffff:'))) {
      // 对于本地开发，不传递IP参数让API使用请求来源IP
      clientIp = '';
    }

    console.log('IP定位请求，客户端IP:', clientIp || '自动检测');

    // 优先使用高德地图IP定位API（对中国地区更准确）
    const AMAP_API_KEY = process.env.AMAP_API_KEY || '';

    let locationData = null;
    let source = '';

    if (AMAP_API_KEY) {
      try {
        // 高德地图IP定位API
        // 不传ip参数时，高德会根据请求来源IP自动定位
        const amapUrl = `https://restapi.amap.com/v3/ip?key=${AMAP_API_KEY}${clientIp ? '&ip=' + clientIp : ''}`;
        console.log('尝试高德地图IP定位...');

        const amapResponse = await axios.get(amapUrl, {
          timeout: 5000
        });

        const amapData = amapResponse.data;

        if (amapData.status === '1' && amapData.province && amapData.province !== '') {
          console.log('高德地图IP定位成功:', amapData);

          // 高德返回的是矩形范围，取中心点
          const rect = amapData.rectangle?.split(';') || [];
          let longitude = 0, latitude = 0;

          if (rect.length >= 2) {
            const point1 = rect[0].split(',');
            const point2 = rect[1].split(',');
            longitude = (parseFloat(point1[0]) + parseFloat(point2[0])) / 2;
            latitude = (parseFloat(point1[1]) + parseFloat(point2[1])) / 2;
          }

          locationData = {
            ip: clientIp || amapData.ip,
            country: '中国',
            province: amapData.province,
            city: amapData.city || amapData.province,
            district: '', // 高德IP定位通常无法到区县级别
            adcode: amapData.adcode
          };
          if (longitude && latitude) {
            locationData.longitude = longitude;
            locationData.latitude = latitude;
          }

          // 如果IP定位没有返回经纬度（rectangle为空），尝试用城市名地理编码补全
          if (!locationData.longitude && locationData.city) {
            try {
              const geoUrl = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_API_KEY}&address=${encodeURIComponent(locationData.city)}&city=${encodeURIComponent(locationData.city)}`;
              const geoRes = await axios.get(geoUrl, { timeout: 5000 });
              if (geoRes.data.status === '1' && geoRes.data.geocodes && geoRes.data.geocodes.length > 0) {
                const loc = geoRes.data.geocodes[0].location.split(',');
                locationData.longitude = parseFloat(loc[0]);
                locationData.latitude = parseFloat(loc[1]);
                console.log('IP定位经纬度通过地理编码补全:', locationData.longitude, locationData.latitude);
              }
            } catch (geoErr) {
              console.log('IP定位经纬度补全失败:', geoErr.message);
            }
          }

          source = '高德地图';
        } else {
          console.log('高德地图IP定位返回无效数据:', amapData);
        }
      } catch (amapError) {
        console.error('高德地图IP定位失败:', amapError.message);
      }
    }

    // 如果高德地图定位失败，回退到ip-api.com
    if (!locationData) {
      try {
        console.log('回退到ip-api.com...');
        let url = 'http://ip-api.com/json/?lang=zh-CN';
        if (clientIp && !clientIp.includes('::') && clientIp !== '127.0.0.1') {
          url = `http://ip-api.com/json/${clientIp}?lang=zh-CN`;
        }

        const response = await axios.get(url, {
          timeout: 5000
        });

        const data = response.data;

        if (data.status !== 'fail') {
          console.log('ip-api.com定位成功:', data);
          locationData = {
            ip: data.query,
            country: data.country,
            province: data.regionName,
            city: data.city,
            district: '', // IP定位通常无法到区县级别
            latitude: data.lat,
            longitude: data.lon,
            timezone: data.timezone
          };
          source = 'ip-api.com';
        }
      } catch (fallbackError) {
        console.error('ip-api.com定位失败:', fallbackError.message);
      }
    }

    if (locationData) {
      return res.json({
        success: true,
        data: locationData,
        source
      });
    }

    // 所有定位方式都失败
    console.log('所有IP定位方式都失败');
    return res.status(400).json({
      error: 'IP定位失败',
      message: '无法获取位置信息，请手动选择位置'
    });
  } catch (error) {
    console.error('IP定位失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
    }

    // 返回错误信息，但不要返回500状态码，让前端可以处理
    res.json({
      success: false,
      error: 'IP定位服务失败',
      message: error.message
    });
  }
});

/**
 * 地理编码：将地址转换为经纬度
 * 注意：这是高德地图的功能，需要配置高德API Key
 */
router.post('/geocode', async (req, res) => {
  try {
    const { address, city } = req.body;

    if (!address) {
      return res.status(400).json({ error: '地址不能为空' });
    }

    // 这里需要配置高德地图API Key
    const AMAP_API_KEY = process.env.AMAP_API_KEY || '';

    if (!AMAP_API_KEY) {
      return res.status(400).json({
        error: '高德地图API Key未配置',
        message: '请在.env文件中配置AMAP_API_KEY'
      });
    }

    // 使用高德地图地理编码API
    // 优化参数以获得更精确的结果：
    // - city: 指定查询城市
    // - output=json: 返回JSON格式
    // - address: 待解析的地址
    // 使用encodeURIComponent确保特殊字符正确编码
    const url = `https://restapi.amap.com/v3/geocode/geo?key=${AMAP_API_KEY}&address=${encodeURIComponent(address)}&city=${encodeURIComponent(city || '')}&output=json&batch=false`;

    console.log('地理编码请求:', url);

    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    console.log('地理编码响应:', data);

    if (data.status !== '1' || !data.geocodes || data.geocodes.length === 0) {
      return res.status(400).json({
        error: '地址解析失败',
        message: data.info || '无法找到该地址'
      });
    }

    const geocode = data.geocodes[0];
    const location = geocode.location.split(',');

    res.json({
      success: true,
      data: {
        longitude: parseFloat(location[0]),
        latitude: parseFloat(location[1]),
        level: geocode.level,
        formattedAddress: geocode.formatted_address,
        province: geocode.province,
        city: geocode.city,
        district: geocode.district,
        township: geocode.township,
        street: geocode.street
      }
    });
  } catch (error) {
    console.error('地理编码失败:', error);
    res.status(500).json({
      error: '地理编码失败',
      message: error.message
    });
  }
});

/**
 * 关键字搜索（模糊搜索）
 * 使用高德地图Place API进行POI搜索
 */
router.post('/search', async (req, res) => {
  try {
    const { keyword, city, page = 1, pageSize = 10, longitude, latitude } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }

    const AMAP_API_KEY = process.env.AMAP_API_KEY || '';

    if (!AMAP_API_KEY) {
      return res.status(400).json({
        error: '高德地图API Key未配置',
        message: '请在.env文件中配置AMAP_API_KEY'
      });
    }

    // 优先使用坐标进行附近搜索（更精确），否则使用城市名搜索
    let url;
    if (longitude && latitude) {
      // 基于当前位置的附近搜索，距离按由近到远排序
      url = `https://restapi.amap.com/v3/place/around?key=${AMAP_API_KEY}&location=${longitude},${latitude}&keywords=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city || '')}&sortrule=distance&page=${page}&offset=${pageSize}&extensions=base`;
      console.log('基于坐标的附近搜索:', url);
    } else {
      // 无坐标时使用关键词搜索
      const citylimit = city ? 'true' : 'false';
      url = `https://restapi.amap.com/v3/place/text?key=${AMAP_API_KEY}&keywords=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city || '')}&citylimit=${citylimit}&page=${page}&offset=${pageSize}&extensions=base`;
      console.log('关键字搜索请求:', url);
    }

    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    console.log('关键字搜索响应:', data);

    if (data.status !== '1') {
      console.log('高德API返回错误状态:', data.info);
      return res.status(400).json({
        success: false,
        error: '搜索失败',
        message: data.info || '未找到相关地点'
      });
    }

    if (!data.pois || data.pois.length === 0) {
      console.log('没有找到POI结果');
      return res.json({
        success: true,
        data: {
          count: 0,
          results: [],
          page,
          pageSize,
          totalPage: 0
        }
      });
    }

    // 格式化搜索结果
    const results = data.pois.map(poi => {
      const location = poi.location?.split(',') || [];
      return {
        id: poi.id,
        name: poi.name,
        address: poi.address || '',
        province: poi.pname || '',
        city: poi.cityname || '',
        district: poi.adname || '',
        longitude: location[0] ? parseFloat(location[0]) : 0,
        latitude: location[1] ? parseFloat(location[1]) : 0,
        type: poi.type || '',
        distance: poi.distance ? parseFloat(poi.distance) : null,
        tel: poi.tel || ''
      };
    });

    res.json({
      success: true,
      data: {
        count: data.count || 0,
        results,
        page,
        pageSize,
        totalPage: Math.ceil((data.count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('关键字搜索失败:', error);
    console.error('错误详情:', error.response?.data || error.message);

    // 返回错误信息，确保前端可以正确处理
    res.json({
      success: false,
      error: '搜索失败',
      message: error.message || '搜索服务异常'
    });
  }
});

/**
 * 逆地理编码：将经纬度转换为地址
 * 注意：这是高德地图的功能，需要配置高德API Key
 */
router.post('/regeocode', async (req, res) => {
  try {
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({ error: '经纬度不能为空' });
    }

    // 这里需要配置高德地图API Key
    const AMAP_API_KEY = process.env.AMAP_API_KEY || '';

    if (!AMAP_API_KEY) {
      return res.status(400).json({
        error: '高德地图API Key未配置',
        message: '请在.env文件中配置AMAP_API_KEY'
      });
    }

    // 使用高德地图逆地理编码API
    // 优化参数以提高定位准确性：
    // - extensions=all: 返回详细POI和道路信息
    // - radius=500: 500米范围内的POI
    // - homeorcorp=0: 不偏好返回家庭或公司地址，返回最准确的位置
    // - poitype=0: 返回所有类型的POI
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_API_KEY}&location=${longitude},${latitude}&extensions=all&radius=500&homeorcorp=0&poitype=0&batch=false`;

    console.log('逆地理编码请求:', url);

    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    console.log('逆地理编码响应:', data);

    if (data.status !== '1' || !data.regeocode) {
      console.log('高德地图 API 返回错误:', data);
      // 返回空数据而不是错误，让前端可以继续使用
      return res.json({
        success: true,
        data: {
          province: '',
          city: '',
          district: '',
          township: '',
          street: '',
          streetNumber: '',
          formattedAddress: '',
          adcode: ''
        }
      });
    }

    const regeocode = data.regeocode;
    const addressComponent = regeocode.addressComponent || {};

    // 优先使用POI的名称和地址信息，这通常更准确
    let formattedAddress = regeocode.formatted_address || '';
    let poiName = '';
    let poiAddress = '';

    if (regeocode.pois && regeocode.pois.length > 0) {
      const poi = regeocode.pois[0];
      poiName = poi.name || '';
      poiAddress = poi.address || '';

      // 如果有POI信息，使用更详细的地址
      if (poiName && poiAddress) {
        formattedAddress = `${poiName}（${poiAddress}）`;
      } else if (poiName) {
        formattedAddress = poiName;
      }
    }

    res.json({
      success: true,
      data: {
        province: addressComponent.province || '',
        city: addressComponent.city || '',
        district: addressComponent.district || '',
        township: addressComponent.township || '',
        street: addressComponent.street || '',
        streetNumber: addressComponent.streetNumber || '',
        formattedAddress: formattedAddress,
        poiName: poiName,
        poiAddress: poiAddress,
        adcode: addressComponent.adcode
      }
    });
  } catch (error) {
    console.error('逆地理编码失败:', error);
    // 返回空数据而不是错误，让前端可以继续使用
    res.json({
      success: true,
      data: {
        province: '',
        city: '',
        district: '',
        township: '',
        street: '',
        streetNumber: '',
        formattedAddress: '',
        adcode: ''
      }
    });
  }
});

module.exports = router;
