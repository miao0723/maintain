import{h as U,E as Y}from"./jspdf.es.min-BfRw8XsF.js";function L(n){return{total_income:"总收入",online_income:"在线支付收入",transfer_income:"转账收入",avg_amount:"平均订单金额",growth_rate:"增长率",total_expense:"总支出",purchase_expense:"采购支出",salary_expense:"人员工资",operation_expense:"运营费用",other_expense:"其他支出",total_orders:"总订单数",completed_orders:"已完成订单",processing_orders:"处理中订单",pending_orders:"待处理订单",cancelled_orders:"已取消订单",completion_rate:"完成率",date:"日期",order_count:"订单数量",online_payment:"在线支付",transfer:"转账",count:"数量"}[n]||n.replace(/_/g," ").replace(/\b\w/g,m=>m.toUpperCase())}function A(n,e){return typeof e!="number"?String(e):n.includes("income")||n.includes("expense")||n.includes("amount")?`¥${e.toFixed(2)}`:n.includes("rate")?`${e.toFixed(1)}%`:String(e)}function G(n){return n?n.replace(/^[\s*\|]+|[\s*\|]+$/gm,"").replace(/^\*{3,}\s*$/gm,"").replace(/^\-{3,}\s*$/gm,"").replace(/\|+/g," ").replace(/\*\*/g,"").replace(new RegExp("(?<!\\*)\\*(?!\\*)","g"),""):""}function q(n){return n?G(n).replace(/^### (.*$)/gim,"<h4>$1</h4>").replace(/^## (.*$)/gim,"<h3>$1</h3>").replace(/^# (.*$)/gim,"<h2>$1</h2>").replace(/^\- (.*$)/gim,"<li>$1</li>").replace(/\n/gim,"<br>").replace(/<li>(.*?)<br>/gim,"<ul><li>$1</li></ul>"):""}async function Q(n,e,m,k,a){a&&a(10,"正在准备生成...");try{const p=document.createElement("div");p.style.cssText=`
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 794px;
      padding: 20px;
      font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      background: white;
    `;const B=(t,i=20)=>{if(t.length<=i)return t;const o=Math.ceil(t.length/i);return t.filter((r,l)=>l%o===0)},b=(t,i,o)=>`
      <h3 style="margin: 20px 0 10px 0; color: #303133; font-size: 16px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 8px;">${o}</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
        <thead>
          <tr style="background: #f5f5f5;">
            ${t.map(r=>`<th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">${r}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${i.map(r=>`
            <tr style="background: white;">
              ${r.map((l,c)=>`
                <td style="border: 1px solid #ddd; padding: 8px; text-align: ${c===r.length-1?"right":"left"};">${l}</td>
              `).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    `,I=t=>{if(!t||t.length===0)return"";try{const i=s=>{const d=parseFloat(s);return isFinite(d)&&!isNaN(d)?d:0},o=t.map(s=>{const d=Object.keys(s).find(h=>h.includes("total_income")||h.includes("total_expense")||h.includes("count"));return i(s[d]||0)}).filter(s=>isFinite(s)&&!isNaN(s)),r=o.length>0?Math.max(...o):1,l=150,c=Math.max(15,Math.floor(700/t.length)),f=Math.min(10,Math.floor(100/t.length));let E="";return t.forEach((s,d)=>{const h=Object.keys(s).find(_=>_.includes("total_income")||_.includes("total_expense")||_.includes("count")),u=i(s[h]||0),N=isFinite(r)&&r>0?u/r*(l-20):0,T=isFinite(d)&&isFinite(c)&&isFinite(f)?50+d*(c+f):50,g=isFinite(c)?c:15,F=isFinite(N)?Math.max(0,N):0,w=isFinite(T)?T:50,O=isFinite(w)&&isFinite(g)?w+g/2:50,W=isFinite(F)?F+30:30,v=s.date&&typeof s.date=="string"?s.date:"",X=v.length>=5?v.slice(-5):v,R=isFinite(u)?u.toFixed(0):"0";E+=`
            <div style="position: absolute; left: ${w}px; bottom: 25px; width: ${g}px; height: ${F}px; background: #409EFF; border-radius: 2px;"></div>
            <div style="position: absolute; left: ${O}px; bottom: 5px; width: ${g}px; text-align: center; font-size: 9px; color: #909399; transform: translateX(-50%); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${X}</div>
            ${u>0?`<div style="position: absolute; left: ${O}px; bottom: ${W}px; width: ${g}px; text-align: center; font-size: 8px; color: #606266; transform: translateX(-50%); white-space: nowrap;">${R}</div>`:""}
          `}),`
          <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 4px; position: relative; height: ${l+40}px; border: 1px solid #eee;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #303133;">趋势可视化</h4>
            <div style="position: absolute; left: 5px; top: 50%; transform: translateY(-50%); font-size: 9px; color: #909399;">数值</div>
            ${E}
          </div>
        `}catch(i){return console.error("构建趋势图表时出错:",i),""}};let S="";if(e.statistics){const t=Object.entries(e.statistics).map(([i,o])=>[L(i),A(i,o)]);S=b(["统计项目","数值"],t,"统计概览")}let M="",z="";if(e.timeline&&e.timeline.length>0){const t=B(e.timeline,15),i=t[0],o=Object.keys(i).map(l=>L(l)),r=t.map(l=>Object.entries(l).map(([c,f])=>typeof f=="number"&&(c.includes("income")||c.includes("expense"))?isFinite(f)?f.toFixed(2):"0.00":String(f)));M=b(o,r,`趋势数据${e.timeline.length>15?" (已采样显示"+t.length+"条，共"+e.timeline.length+"条)":""}`),z=I(t)}let H="";if(e.status_stats&&e.status_stats.length>0){const t={pending:"待处理",processing:"处理中",completed:"已完成",cancelled:"已取消"},i=e.status_stats.map(o=>[t[o.status]||o.status,String(o.count)]);H=b(["状态","数量"],i,"订单状态分布")}let C="";m&&(C=`
        <div style="margin-top: 30px; padding: 20px; border-top: 2px solid #409EFF; background: #f0f9ff; border-radius: 0 8px 8px 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="width: 32px; height: 32px; background: #409EFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);">
              <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 style="margin: 0; color: #303133; font-size: 18px; font-weight: bold;">AI 智能分析总结</h3>
          </div>
          <div style="font-size: 12px; color: #606266; line-height: 1.8; padding-left: 10px; border-left: 3px solid #409EFF;">${q(m)}</div>
        </div>
      `),p.innerHTML=`
      <div style="margin-bottom: 20px;">
        <h1 style="margin: 0 0 10px 0; color: #303133; font-size: 24px; font-weight: bold;">${n}</h1>
        <p style="margin: 0; color: #909399; font-size: 11px;">生成时间: ${new Date().toLocaleString("zh-CN")}</p>
      </div>
      ${S}
      ${z}
      ${M}
      ${H}
      ${C}
    `,document.body.appendChild(p),a&&a(30,"正在渲染内容...");const y=await U(p,{scale:2,useCORS:!0,logging:!1,backgroundColor:"#ffffff"});document.body.removeChild(p),a&&a(70,"正在生成PDF...");const $=new Y({orientation:"portrait",unit:"mm",format:"a4"}),K=y.toDataURL("image/png"),j=210,D=y.height*j/y.width;let x=0;const V=297;for(;x<D;)x>0&&$.addPage(),$.addImage(K,"PNG",0,-x,j,D),x+=V;a&&a(100,"正在保存文件..."),$.save(k),a&&a(100,"完成!")}catch(p){throw console.error("PDF导出失败:",p),p}}export{Q as e};
