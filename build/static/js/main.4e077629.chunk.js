(this.webpackJsonpclient=this.webpackJsonpclient||[]).push([[0],{228:function(t,e){},230:function(t,e){},240:function(t,e){},242:function(t,e){},269:function(t,e){},270:function(t,e){},275:function(t,e){},277:function(t,e){},284:function(t,e){},303:function(t,e){},320:function(t,e){},321:function(t,e){},340:function(t,e,n){"use strict";n.r(e);var a=n(0),c=n.n(a),r=n(11),i=n.n(r),s=n(52),o=n(3),l=Object(a.createContext)([]);function d(t){var e=t.children,n=Object(a.useState)([]),c=Object(s.a)(n,2),r=c[0],i=c[1],d=Object(a.useCallback)((function(){fetch("http://hyggecoin.herokuapp.com/chain",{mode:"cors",credentials:"omit"}).then((function(t){return t.json()})).then((function(t){return i(t.data)})).catch((function(t){return console.error(t)}))}),[]);return Object(a.useEffect)((function(){d(),setInterval(d,2e4)}),[d]),Object(o.jsx)(l.Provider,{value:r,children:e})}var j=n(93),u=n(20),h=n(4),b=n(381),x=n(384),O=n(406),p=n(386),f=n(387),m=n(389),g=n(104),v=n(388),w=n(341),S=n(393),y=n(394),I=n(199),B=n.n(I),k=n(201),C=n.n(k),N=n(202),H=n.n(N),E=n(203),P=n.n(E),z=n(200),D=n.n(z),M=n(390),W=n(391),A=n(392),G=n(12),J=Object(b.a)((function(t){return{root:{display:"flex"},toolbar:{paddingRight:24},toolbarIcon:Object(u.a)({display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"0 8px"},t.mixins.toolbar),appBar:{zIndex:t.zIndex.drawer+1,transition:t.transitions.create(["width","margin"],{easing:t.transitions.easing.sharp,duration:t.transitions.duration.leavingScreen})},appBarShift:{marginLeft:240,width:"calc(100% - ".concat(240,"px)"),transition:t.transitions.create(["width","margin"],{easing:t.transitions.easing.sharp,duration:t.transitions.duration.enteringScreen})},menuButton:{marginRight:36},menuButtonHidden:{display:"none"},title:{flexGrow:1},drawerPaper:{position:"relative",whiteSpace:"nowrap",width:240,transition:t.transitions.create("width",{easing:t.transitions.easing.sharp,duration:t.transitions.duration.enteringScreen})},drawerPaperClose:Object(j.a)({overflowX:"hidden",transition:t.transitions.create("width",{easing:t.transitions.easing.sharp,duration:t.transitions.duration.leavingScreen}),width:t.spacing(7)},t.breakpoints.up("sm"),{width:t.spacing(9)}),appBarSpacer:t.mixins.toolbar,content:{flexGrow:1,height:"100vh",overflow:"auto"},container:{paddingTop:t.spacing(4),paddingBottom:t.spacing(4)},paper:{padding:t.spacing(2),display:"flex",overflow:"auto",flexDirection:"column"},fixedHeight:{height:240}}}));function F(t){var e=t.children,n=J(),a=c.a.useState(!0),r=Object(s.a)(a,2),i=r[0],l=r[1],d=Object(G.f)();return Object(o.jsxs)("div",{className:n.root,children:[Object(o.jsx)(x.a,{}),Object(o.jsx)(p.a,{position:"absolute",className:Object(h.a)(n.appBar,i&&n.appBarShift),children:Object(o.jsxs)(f.a,{className:n.toolbar,children:[Object(o.jsx)(w.a,{edge:"start",color:"inherit","aria-label":"open drawer",onClick:function(){l(!0)},className:Object(h.a)(n.menuButton,i&&n.menuButtonHidden),children:Object(o.jsx)(B.a,{})}),Object(o.jsx)(g.a,{component:"h1",variant:"h6",color:"inherit",noWrap:!0,className:n.title,children:"Hyggecoin"})]})}),Object(o.jsxs)(O.a,{variant:"permanent",classes:{paper:Object(h.a)(n.drawerPaper,!i&&n.drawerPaperClose)},open:i,children:[Object(o.jsx)("div",{className:n.toolbarIcon,children:Object(o.jsx)(w.a,{onClick:function(){l(!1)},children:Object(o.jsx)(D.a,{})})}),Object(o.jsx)(v.a,{}),Object(o.jsx)(m.a,{children:Object(o.jsxs)("div",{children:[Object(o.jsxs)(M.a,{button:!0,onClick:function(){return d.push("/chain-explorer")},children:[Object(o.jsx)(W.a,{children:Object(o.jsx)(C.a,{})}),Object(o.jsx)(A.a,{primary:"Chain Explorer"})]}),Object(o.jsxs)(M.a,{button:!0,onClick:function(){return d.push("/wallet")},children:[Object(o.jsx)(W.a,{children:Object(o.jsx)(H.a,{})}),Object(o.jsx)(A.a,{primary:"Wallet"})]}),Object(o.jsxs)(M.a,{button:!0,onClick:function(){return d.push("/mine")},children:[Object(o.jsx)(W.a,{children:Object(o.jsx)(P.a,{})}),Object(o.jsx)(A.a,{primary:"Mine Coins"})]})]})})]}),Object(o.jsxs)("main",{className:n.content,children:[Object(o.jsx)("div",{className:n.appBarSpacer}),Object(o.jsx)(S.a,{maxWidth:"lg",className:n.container,children:Object(o.jsx)(y.a,{container:!0,spacing:3,children:e})})]})]})}var K=n(40),L=n(33),R=n(395),T=n(396),X=n(407),q=n(397),Q=n(398),U=n(205),V=n.n(U),Y=n(224);function Z(t){var e=Y.createHash("sha256");return e.update(t),e.digest("hex")}var $=n(204);function _(t){return Z(function(t){var e=t.previousHash,n=t.timestamp,a=t.data,c=t.nonce;return e+n+JSON.stringify(a)+c}(t))}function tt(t){return Object(u.a)(Object(u.a)({},t),{},{hash:_(t)})}new $.ec("secp256k1");function et(t,e,n){return function(t,e){var n,a;return[].concat(Object(L.a)(t),[(n=e,a=t[t.length-1].hash,tt({timestamp:Date.now(),data:n,previousHash:a,hash:"",nonce:0}))]).reduce((function(t,e){var n=e.data.reduce((function(t,e){return t.concat(function(t){return t.outputs.map((function(e,n){return{transactionId:t.id,index:n,address:e.address,amount:e.amount}}))}(e))}),[]),a=e.data.reduce((function(t,e){return t.concat(e.inputs)}),[]);return[].concat(Object(L.a)(t),Object(L.a)(n)).filter((function(t){return!a.find((function(e){return e.transactionId===t.transactionId&&e.transactionOutputIndex===t.index}))}))}),[])}(t,e).filter((function(t){return t.address===n}))}function nt(t,e){var n=t.inputs[0];if(!n.transactionId)return null;var a=e.find((function(t){return t.data.find((function(t){return t.id===n.transactionId}))})),c=null===a||void 0===a?void 0:a.data.find((function(t){return t.id===n.transactionId})),r=null===c||void 0===c?void 0:c.outputs[n.transactionOutputIndex];return(null===r||void 0===r?void 0:r.address)||null}var at=Object(b.a)({hash:{fontSize:12}});function ct(t){return"".concat(t.substr(0,8),"...").concat(t.substr(-8))}function rt(t){var e=t.transaction,n=at(),c=nt(e,Object(a.useContext)(l)),r=c?Object(o.jsx)(K.b,{to:"/wallet/".concat(c),children:ct(c)}):Object(o.jsx)("strong",{children:"COINBASE"});return Object(o.jsxs)(o.Fragment,{children:[Object(o.jsx)(R.a,{children:Object(o.jsxs)(T.a,{children:[Object(o.jsx)(g.a,{color:"textSecondary",className:n.hash,children:e.id}),Object(o.jsx)(g.a,{children:e.outputs.map((function(t,e){return Object(o.jsxs)("div",{children:[r," > ",Object(o.jsx)(K.b,{to:"/wallet/".concat(t.address),children:ct(t.address)})," for ",Object(o.jsx)("strong",{children:t.amount})," coins"]},e)}))}),e.message&&Object(o.jsxs)(g.a,{children:['Included message: "',e.message,'"']})]})}),Object(o.jsx)(v.a,{})]})}var it=Object(b.a)({hash:{fontSize:12}});function st(t){var e=t.block,n=t.index,a=it();return Object(o.jsxs)(R.a,{children:[Object(o.jsxs)(T.a,{children:[Object(o.jsxs)(g.a,{component:"h2",variant:"h6",color:"textSecondary",gutterBottom:!0,children:["Block ",n]}),Object(o.jsx)(g.a,{color:"textSecondary",className:a.hash,children:e.hash}),Object(o.jsx)(g.a,{color:"textSecondary",className:a.hash,gutterBottom:!0,children:new Date(e.timestamp).toLocaleString()})]}),Object(o.jsxs)(X.a,{children:[Object(o.jsx)(q.a,{expandIcon:Object(o.jsx)(V.a,{}),"aria-controls":"panel1a-content",id:"panel1a-header",children:Object(o.jsx)(g.a,{color:"textSecondary",children:"Transactions"})}),Object(o.jsx)(Q.a,{children:Object(o.jsx)(y.a,{container:!0,spacing:1,children:e.data.map((function(t){return Object(o.jsx)(y.a,{item:!0,xs:12,children:Object(o.jsx)(rt,{transaction:t},t.id)})}))})})]})]})}function ot(){var t=Object(a.useContext)(l),e=Object(a.useMemo)((function(){return Object(L.a)(t).reverse()}),[t]);return Object(o.jsx)(y.a,{container:!0,spacing:2,children:e.map((function(t,n){return Object(o.jsx)(y.a,{item:!0,lg:6,children:Object(o.jsx)(st,{block:t,index:e.length-n},t.hash)})}))})}var lt=n(207),dt=n(399),jt=n(400),ut=n(401),ht=n(402),bt=n(403),xt=Object(b.a)((function(t){return{paper:{padding:t.spacing(2),display:"flex",flexDirection:"column",wordBreak:"break-all"}}}));function Ot(){var t=Object(G.g)().address,e=Object(a.useContext)(l),n=xt(),c=e.length>0?function(t,e,n){return et(t,e,n).reduce((function(t,e){return t+e.amount}),0)}(e,[],t):null,r=Object(a.useMemo)((function(){return function(t,e,n){var a=t.reduce((function(t,e){return t.concat(e.data)}),[]).concat(e);return console.log(a),a.filter((function(e){return e.outputs.find((function(t){return t.address===n}))||nt(e,t)===n}))}(e,[],t).reverse()}),[t,e]);return Object(o.jsx)(o.Fragment,{children:Object(o.jsx)(y.a,{container:!0,spacing:2,children:Object(o.jsx)(y.a,{item:!0,xs:12,children:Object(o.jsxs)(lt.a,{className:n.paper,children:[Object(o.jsxs)(g.a,{component:"h2",variant:"h6",color:"primary",gutterBottom:!0,children:["Wallet ",t]}),null!==c&&Object(o.jsxs)(g.a,{component:"h3",variant:"h6",color:"textSecondary",gutterBottom:!0,children:["Balance: ",c]}),Object(o.jsxs)(dt.a,{size:"small",children:[Object(o.jsx)(jt.a,{children:Object(o.jsxs)(ut.a,{children:[Object(o.jsx)(ht.a,{children:"Incoming / Outgoing"}),Object(o.jsx)(ht.a,{children:"Address"}),Object(o.jsx)(ht.a,{align:"right",children:"Amount"}),Object(o.jsx)(ht.a,{children:"Message"})]})}),Object(o.jsx)(bt.a,{children:r.map((function(n){var a=nt(n,e),c=a===t,r=n.outputs.find((function(e){return e.address!==t})),i=c?null===r||void 0===r?void 0:r.address:a,s=i?Object(o.jsx)(K.b,{to:"/wallet/".concat(i),children:ct(i)}):"COINBASE";return Object(o.jsxs)(ut.a,{children:[Object(o.jsx)(ht.a,{children:c?"Outgoing":"Incoming"}),Object(o.jsx)(ht.a,{children:s}),Object(o.jsx)(ht.a,{align:"right",children:r?r.amount:n.outputs[0].amount}),Object(o.jsx)(ht.a,{children:n.message})]},n.id)}))})]})]})})})})}var pt=n(404),ft=Object(b.a)((function(t){return{paper:{padding:t.spacing(2),display:"flex",flexDirection:"column",wordBreak:"break-all"}}}));function mt(){var t=ft(),e=Object(a.useState)(localStorage.getItem("publicKey")||""),n=Object(s.a)(e,2),c=n[0],r=n[1],i=Object(a.useState)(localStorage.getItem("secret")||""),l=Object(s.a)(i,2),d=l[0],j=l[1];return Object(a.useEffect)((function(){localStorage.setItem("publicKey",c),localStorage.setItem("secret",d)}),[c,d]),Object(o.jsx)(y.a,{container:!0,spacing:2,children:Object(o.jsx)(y.a,{item:!0,xs:12,children:Object(o.jsxs)(lt.a,{className:t.paper,children:[Object(o.jsx)(g.a,{component:"h2",variant:"h6",color:"primary",gutterBottom:!0,children:"My Wallet"}),Object(o.jsx)(g.a,{component:"h3",variant:"h6",color:"textSecondary",gutterBottom:!0,children:"Set your wallet details"}),Object(o.jsx)(pt.a,{label:"Public key",variant:"outlined",value:c,onChange:function(t){return r(t.target.value)},margin:"normal"}),Object(o.jsx)(pt.a,{label:"Secret key",variant:"outlined",value:d,onChange:function(t){return j(t.target.value)},margin:"normal"}),c&&Object(o.jsx)(K.b,{to:"/wallet/".concat(c),children:"Go to wallet"})]})})})}function gt(){return Object(o.jsx)(d,{children:Object(o.jsx)(K.a,{children:Object(o.jsx)(F,{children:Object(o.jsxs)(G.c,{children:[Object(o.jsx)(G.a,{path:"/chain-explorer",children:Object(o.jsx)(ot,{})}),Object(o.jsx)(G.a,{path:"/wallet",exact:!0,children:Object(o.jsx)(mt,{})}),Object(o.jsx)(G.a,{path:"/wallet/:address",children:Object(o.jsx)(Ot,{})})]})})})})}i.a.render(Object(o.jsx)(gt,{}),document.getElementById("root"))}},[[340,1,2]]]);
//# sourceMappingURL=main.4e077629.chunk.js.map