import{K as me,N as _e,c as w,b as t,w as a,G as m,r as d,i as h,h as E,O as fe,o as c,a as v,g as i,Q as ye,k as D,q as p,F as S,n as $,l as G,P as K,m as Q,I as be}from"./index-DKWnCgOF.js";import{g as ge,a as H,d as ve,u as ke,b as Ve}from"./contractTemplate-DRanf7n3.js";import{_ as Ce}from"./_plugin-vue_export-helper-DlAUqK2U.js";const we={class:"contract-templates-container"},he={class:"card-header"},xe={class:"search-section"},Ue={class:"pagination-section"},ze={class:"template-editor"},Te={class:"editor-toolbar"},De={key:0,style:{"margin-top":"10px"}},Se={class:"template-preview"},$e={__name:"ContractTemplates",setup(Be){const B=h(!1),y=h(!1),T=h(!1),U=h(!1),N=h(null),F=[{key:"contract_number",label:"合同编号",default:""},{key:"customer_name",label:"客户名称",default:""},{key:"customer_phone",label:"客户电话",default:""},{key:"machine_type",label:"机械类型",default:""},{key:"service_content",label:"服务内容",default:""},{key:"annual_fee",label:"合同金额",default:"0"},{key:"start_date",label:"开始日期",default:""},{key:"end_date",label:"结束日期",default:""},{key:"sign_date",label:"签订日期",default:""},{key:"company_name",label:"公司名称",default:""},{key:"company_address",label:"公司地址",default:""},{key:"company_phone",label:"公司电话",default:""}],u=E({name:"",type:""}),_=E({page:1,pageSize:10,total:0}),o=E({id:null,name:"",type:"repair_contract",description:"",content:"",custom_variables:[]}),J={name:[{required:!0,message:"请输入模板名称",trigger:"blur"}],type:[{required:!0,message:"请选择模板类型",trigger:"change"}],content:[{required:!0,message:"请输入模板内容",trigger:"blur"}]},k=h(null),R=h([]),M=r=>({repair_contract:"维修合同",service_agreement:"服务协议",confidentiality:"保密协议",trade_contract:"交易合同"})[r]||r,V=async()=>{B.value=!0;try{const r={};u.name&&(r.name=u.name),u.type&&(r.type=u.type);const e=await ge(_.page,_.pageSize,r);if(e.code===200||e.code===0||e.code===201){const s=e.data||{};R.value=s.items||s.list||[],_.total=s.total||0}}catch(r){console.error("获取合同模板列表失败",r),m.error("获取数据失败")}finally{B.value=!1}},j=()=>{_.page=1,V()},W=()=>{u.name="",u.type="",j()},X=()=>{o.id=null,o.name="",o.type="repair_contract",o.description="",o.content=I(o.type),o.custom_variables=[]},I=(r="repair_contract")=>r==="trade_contract"?`产品买卖合同

合同编号：{{contract_number}}
签订地点：{{sign_place}}
签订日期：{{sign_date}}

买方（甲方）：{{customer_name}}
联系电话：{{customer_phone}}

卖方（乙方）：{{company_name}}
联系电话：{{company_phone}}
地址：{{company_address}}

根据《中华人民共和国民法典》及相关法律法规，甲乙双方经平等协商，就产品买卖事宜达成如下协议：

一、产品名称、规格、数量及价格

产品名称：{{product_name}}
规格型号：{{product_spec}}
数量：{{quantity}}
单价：¥{{unit_price}}
总金额：¥{{total_amount}}

二、质量要求及技术标准
{{quality_standard}}

三、交货
交货日期：{{delivery_date}}
交货地点：{{delivery_place}}

四、验收方式
{{acceptance_method}}

五、付款方式
{{payment_method}}

六、违约责任
{{liability_terms}}

七、争议解决
{{dispute_resolution}}

八、其他约定事项
本合同一式两份，甲乙双方各执一份，自双方签字盖章之日起生效。

买方（甲方）：{{buyer_sign || customer_name}}
日期：{{sign_date}}

卖方（乙方）：{{seller_sign || company_name}}
日期：{{sign_date}}`:`维修服务合同

合同编号：{{contract_number}}
签订日期：{{sign_date}}

甲方（委托方）：{{customer_name}}
联系电话：{{customer_phone}}

乙方（服务方）：{{company_name}}
联系电话：{{company_phone}}
地址：{{company_address}}

一、服务内容
乙方为甲方提供以下维修服务：
{{service_content}}

机械类型：{{machine_type}}

二、服务期限
自 {{start_date}} 起至 {{end_date}} 止。

三、服务费用
合同总金额：人民币 {{annual_fee}} 元

四、服务承诺
1. 乙方承诺按照约定时间完成维修服务
2. 乙方保证维修质量，提供质保服务
3. 乙方承诺使用合格配件

五、违约责任
1. 甲方未按时支付费用的，应承担违约责任
2. 乙方未按时完成服务的，应承担相应责任

六、其他条款
本合同一式两份，甲乙双方各执一份，具有同等法律效力。

甲方（签字）：____________________
乙方（签字）：____________________

日期：{{sign_date}}`,Y=()=>{X(),U.value=!1,y.value=!0},Z=async r=>{try{const e=await H(r.id);if(e.code===200||e.code===0||e.code===201){const s=e.data;Object.assign(o,s),o.custom_variables||(o.custom_variables=[]),U.value=!0,y.value=!0}}catch{m.error("获取模板详情失败")}},ee=async r=>{try{const e=await H(r.id);(e.code===200||e.code===0||e.code===201)&&(k.value=e.data,T.value=!0)}catch{m.error("获取模板详情失败")}},te=async r=>{try{await be.confirm("确定要删除该合同模板吗？","提示",{confirmButtonText:"确定",cancelButtonText:"取消",type:"warning"});const e=await ve(r.id);(e.code===200||e.code===0||e.code===201)&&(m.success("删除成功"),V())}catch(e){e!=="cancel"&&m.error(e.message||"删除失败")}},ae=r=>{const e=`{{${r}}}`;o.content?o.content+=e:o.content=e},le=()=>{o.custom_variables||(o.custom_variables=[]),o.custom_variables.push({key:"",label:"",default:""})},oe=r=>{o.custom_variables.splice(r,1)},ne=async()=>{var s;if(!await((s=N.value)==null?void 0:s.validate().catch(()=>!1)))return;const e=[...F];o.custom_variables&&o.custom_variables.length>0&&o.custom_variables.forEach(n=>{n.key&&e.push({key:n.key,label:n.label||n.key,default:n.default||""})}),o.variables=e;try{if(U.value){const n=await ke(o.id,o);n.code===200||n.code===0||n.code===201?(m.success("模板更新成功"),y.value=!1,V()):m.error(n.message||"更新失败")}else{const n=await Ve(o);n.code===200||n.code===0||n.code===201?(m.success("模板创建成功"),y.value=!1,V()):m.error(n.message||"创建失败")}}catch(n){console.error("提交错误:",n),m.error(n.message||"操作失败")}};return me(()=>{V()}),_e(()=>o.type,r=>{!U.value&&y.value&&(o.content=I(r))}),(r,e)=>{const s=d("el-button"),n=d("el-input"),b=d("el-form-item"),g=d("el-option"),L=d("el-select"),O=d("el-form"),C=d("el-table-column"),q=d("el-tag"),re=d("el-table"),se=d("el-pagination"),ie=d("el-card"),P=d("el-col"),de=d("el-row"),ue=d("el-divider"),A=d("el-dialog"),z=d("el-descriptions-item"),ce=d("el-descriptions"),pe=fe("loading");return c(),w("div",we,[t(ie,{shadow:"never"},{header:a(()=>[v("div",he,[e[13]||(e[13]=v("span",null,"合同模板管理",-1)),t(s,{type:"primary",icon:G(K),onClick:Y},{default:a(()=>[...e[12]||(e[12]=[i("新增模板",-1)])]),_:1},8,["icon"])])]),default:a(()=>[v("div",xe,[t(O,{inline:!0,model:u},{default:a(()=>[t(b,{label:"模板名称"},{default:a(()=>[t(n,{modelValue:u.name,"onUpdate:modelValue":e[0]||(e[0]=l=>u.name=l),placeholder:"请输入模板名称",clearable:""},null,8,["modelValue"])]),_:1}),t(b,{label:"模板类型"},{default:a(()=>[t(L,{modelValue:u.type,"onUpdate:modelValue":e[1]||(e[1]=l=>u.type=l),placeholder:"请选择类型",clearable:""},{default:a(()=>[t(g,{label:"维修合同",value:"repair_contract"}),t(g,{label:"服务协议",value:"service_agreement"}),t(g,{label:"保密协议",value:"confidentiality"}),t(g,{label:"交易合同",value:"trade_contract"})]),_:1},8,["modelValue"])]),_:1}),t(b,null,{default:a(()=>[t(s,{type:"primary",onClick:j},{default:a(()=>[...e[14]||(e[14]=[i("搜索",-1)])]),_:1}),t(s,{onClick:W},{default:a(()=>[...e[15]||(e[15]=[i("重置",-1)])]),_:1})]),_:1})]),_:1},8,["model"])]),ye((c(),D(re,{data:R.value,border:"",stripe:""},{default:a(()=>[t(C,{prop:"name",label:"模板名称",width:"200"}),t(C,{prop:"type",label:"模板类型",width:"120"},{default:a(({row:l})=>[i(p(M(l.type)),1)]),_:1}),t(C,{prop:"description",label:"描述","show-overflow-tooltip":""}),t(C,{prop:"variables",label:"可用变量",width:"200"},{default:a(({row:l})=>[(c(!0),w(S,null,$(l.variables,f=>(c(),D(q,{key:f.key,size:"small",style:{"margin-right":"4px"}},{default:a(()=>[i(p(f.key),1)]),_:2},1024))),128))]),_:1}),t(C,{prop:"created_at",label:"创建时间",width:"180"}),t(C,{prop:"updated_at",label:"更新时间",width:"180"}),t(C,{label:"操作",width:"200",fixed:"right"},{default:a(({row:l})=>[t(s,{link:"",type:"primary",onClick:f=>ee(l)},{default:a(()=>[...e[16]||(e[16]=[i("查看",-1)])]),_:1},8,["onClick"]),t(s,{link:"",type:"primary",onClick:f=>Z(l)},{default:a(()=>[...e[17]||(e[17]=[i("编辑",-1)])]),_:1},8,["onClick"]),t(s,{link:"",type:"danger",onClick:f=>te(l)},{default:a(()=>[...e[18]||(e[18]=[i("删除",-1)])]),_:1},8,["onClick"])]),_:1})]),_:1},8,["data"])),[[pe,B.value]]),v("div",Ue,[t(se,{"current-page":_.page,"onUpdate:currentPage":e[2]||(e[2]=l=>_.page=l),"page-size":_.pageSize,"onUpdate:pageSize":e[3]||(e[3]=l=>_.pageSize=l),"page-sizes":[10,20,50,100],total:_.total,layout:"total, sizes, prev, pager, next, jumper",onSizeChange:V,onCurrentChange:V},null,8,["current-page","page-size","total"])])]),_:1}),t(A,{modelValue:y.value,"onUpdate:modelValue":e[9]||(e[9]=l=>y.value=l),title:U.value?"编辑合同模板":"新增合同模板",width:"1000px","close-on-click-modal":!1},{footer:a(()=>[t(s,{onClick:e[8]||(e[8]=l=>y.value=!1)},{default:a(()=>[...e[22]||(e[22]=[i("取消",-1)])]),_:1}),t(s,{type:"primary",onClick:ne},{default:a(()=>[...e[23]||(e[23]=[i("确定",-1)])]),_:1})]),default:a(()=>[t(O,{model:o,rules:J,ref_key:"formRef",ref:N,"label-width":"120px"},{default:a(()=>[t(de,{gutter:20},{default:a(()=>[t(P,{span:12},{default:a(()=>[t(b,{label:"模板名称",prop:"name"},{default:a(()=>[t(n,{modelValue:o.name,"onUpdate:modelValue":e[4]||(e[4]=l=>o.name=l),placeholder:"请输入模板名称"},null,8,["modelValue"])]),_:1})]),_:1}),t(P,{span:12},{default:a(()=>[t(b,{label:"模板类型",prop:"type"},{default:a(()=>[t(L,{modelValue:o.type,"onUpdate:modelValue":e[5]||(e[5]=l=>o.type=l),placeholder:"请选择模板类型",style:{width:"100%"}},{default:a(()=>[t(g,{label:"维修合同",value:"repair_contract"}),t(g,{label:"服务协议",value:"service_agreement"}),t(g,{label:"保密协议",value:"confidentiality"}),t(g,{label:"交易合同",value:"trade_contract"})]),_:1},8,["modelValue"])]),_:1})]),_:1})]),_:1}),t(b,{label:"描述",prop:"description"},{default:a(()=>[t(n,{modelValue:o.description,"onUpdate:modelValue":e[6]||(e[6]=l=>o.description=l),type:"textarea",rows:2,placeholder:"请输入模板描述"},null,8,["modelValue"])]),_:1}),t(ue,null,{default:a(()=>[i("模板内容（支持使用变量，格式："+p(r.变量名)+"）",1)]),_:1}),t(b,{label:"模板内容",prop:"content"},{default:a(()=>[v("div",ze,[v("div",Te,[e[19]||(e[19]=v("span",{class:"hint"},"可用变量：",-1)),(c(),w(S,null,$(F,l=>t(q,{key:l.key,size:"small",onClick:f=>ae(l.key),style:{cursor:"pointer","margin-right":"6px"}},{default:a(()=>[i(p(l.label)+" ("+p(l.key)+") ",1)]),_:2},1032,["onClick"])),64))]),t(n,{modelValue:o.content,"onUpdate:modelValue":e[7]||(e[7]=l=>o.content=l),type:"textarea",rows:15,placeholder:"请输入模板内容，可以使用 {{变量名}} 格式插入变量",style:{"font-family":"monospace"}},null,8,["modelValue"])])]),_:1}),t(b,{label:"自定义变量",prop:"custom_variables"},{default:a(()=>[t(s,{type:"primary",size:"small",onClick:le,icon:G(K)},{default:a(()=>[...e[20]||(e[20]=[i("添加变量",-1)])]),_:1},8,["icon"]),o.custom_variables&&o.custom_variables.length>0?(c(),w("div",De,[(c(!0),w(S,null,$(o.custom_variables,(l,f)=>(c(),w("div",{key:f,style:{display:"flex",gap:"10px","margin-bottom":"8px","align-items":"center"}},[t(n,{modelValue:l.key,"onUpdate:modelValue":x=>l.key=x,placeholder:"变量名",style:{flex:"1"}},null,8,["modelValue","onUpdate:modelValue"]),t(n,{modelValue:l.label,"onUpdate:modelValue":x=>l.label=x,placeholder:"变量标签",style:{flex:"1"}},null,8,["modelValue","onUpdate:modelValue"]),t(n,{modelValue:l.default,"onUpdate:modelValue":x=>l.default=x,placeholder:"默认值",style:{flex:"1"}},null,8,["modelValue","onUpdate:modelValue"]),t(s,{type:"danger",size:"small",onClick:x=>oe(f)},{default:a(()=>[...e[21]||(e[21]=[i("删除",-1)])]),_:1},8,["onClick"])]))),128))])):Q("",!0)]),_:1})]),_:1},8,["model"])]),_:1},8,["modelValue","title"]),t(A,{modelValue:T.value,"onUpdate:modelValue":e[11]||(e[11]=l=>T.value=l),title:"模板详情",width:"800px"},{footer:a(()=>[t(s,{onClick:e[10]||(e[10]=l=>T.value=!1)},{default:a(()=>[...e[24]||(e[24]=[i("关闭",-1)])]),_:1})]),default:a(()=>[k.value?(c(),D(ce,{key:0,column:2,border:""},{default:a(()=>[t(z,{label:"模板名称",span:2},{default:a(()=>[i(p(k.value.name),1)]),_:1}),t(z,{label:"模板类型"},{default:a(()=>[i(p(M(k.value.type)),1)]),_:1}),t(z,{label:"描述"},{default:a(()=>[i(p(k.value.description),1)]),_:1}),t(z,{label:"可用变量",span:2},{default:a(()=>[(c(!0),w(S,null,$(k.value.variables,l=>(c(),D(q,{key:l.key,style:{"margin-right":"6px"}},{default:a(()=>[i(p(l.label)+" ("+p(l.key)+") ",1)]),_:2},1024))),128))]),_:1}),t(z,{label:"模板内容",span:2},{default:a(()=>[v("div",Se,p(k.value.content),1)]),_:1})]),_:1})):Q("",!0)]),_:1},8,["modelValue"])])}}},Fe=Ce($e,[["__scopeId","data-v-160c56b0"]]);export{Fe as default};
