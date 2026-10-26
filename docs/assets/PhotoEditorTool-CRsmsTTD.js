import{c as le,d as Le,ac as Ze,o as k,a as R,b as x,t as E,v as oe,ad as Ie,F as X,r as ne,D as $,i as K,B as xe,a4 as ye,aj as Yt,_ as J,G as Ne,x as be,$ as Kt,e as S,m as re,u as L,f as de,w as j,ae as Wt,ag as qt,k as Xe,q as Zt,h as Jt,C as Qt,a5 as $e}from"./index-LDwXoAkB.js";import{_ as eo}from"./DropZone.vue_vue_type_script_setup_true_lang-yBRCHNCI.js";import{_ as ct}from"./BaseButton.vue_vue_type_script_setup_true_lang-CusNzwaX.js";import{_ as to}from"./BaseSelect.vue_vue_type_script_setup_true_lang-GLil-p2y.js";import{_ as Q}from"./IconButton.vue_vue_type_script_setup_true_lang-Be_jTyb1.js";import{f as oo,D as ro,p as no,a as ao}from"./useFiles-DmsmnV9j.js";import{F as lo}from"./folder-open-CDMfSkyD.js";import{U as io}from"./undo-2-dD6XG4sa.js";import{S as so}from"./sliders-horizontal-DWJX9kmT.js";import{W as uo}from"./wand-sparkles-BILB6dca.js";import{R as Me}from"./rotate-ccw-CC_4jyuo.js";import{C as co}from"./check-xFi2TgtC.js";import"./chevron-down-DH3pZ0nE.js";const fo=le("aperture",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m14.31 8 5.74 9.94",key:"1y6ab4"}],["path",{d:"M9.69 8h11.48",key:"1wxppr"}],["path",{d:"m7.38 12 5.74-9.94",key:"1grp0k"}],["path",{d:"M9.69 16 3.95 6.06",key:"libnyf"}],["path",{d:"M14.31 16H2.83",key:"x5fava"}],["path",{d:"m16.62 12-5.74 9.94",key:"1vwawt"}]]);const vo=le("chart-area",[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z",key:"q0gr47"}]]);const ho=le("columns-2",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M12 3v18",key:"108xh3"}]]);const mo=le("crop",[["path",{d:"M6 2v14a2 2 0 0 0 2 2h14",key:"ron5a4"}],["path",{d:"M18 22V8a2 2 0 0 0-2-2H2",key:"7s9ehn"}]]);const po=le("flip-horizontal-2",[["path",{d:"m3 7 5 5-5 5V7",key:"couhi7"}],["path",{d:"m21 7-5 5 5 5V7",key:"6ouia7"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 14v2",key:"8jcxud"}],["path",{d:"M12 8v2",key:"1woqiv"}],["path",{d:"M12 2v2",key:"tus03m"}]]);const xo=le("flip-vertical-2",[["path",{d:"m17 3-5 5-5-5h10",key:"1ftt6x"}],["path",{d:"m17 21-5-5-5 5h10",key:"1m0wmu"}],["path",{d:"M4 12H2",key:"rhcxmi"}],["path",{d:"M10 12H8",key:"s88cx1"}],["path",{d:"M16 12h-2",key:"10asgb"}],["path",{d:"M22 12h-2",key:"14jgyd"}]]);const go=le("rotate-ccw-square",[["path",{d:"M20 9V7a2 2 0 0 0-2-2h-6",key:"19z8uc"}],["path",{d:"m15 2-3 3 3 3",key:"177bxs"}],["path",{d:"M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2",key:"d36hnl"}]]);const wo=le("rotate-cw-square",[["path",{d:"M12 5H6a2 2 0 0 0-2 2v3",key:"l96uqu"}],["path",{d:"m9 8 3-3-3-3",key:"1gzgc3"}],["path",{d:"M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",key:"1w2k5h"}]]);const bo=le("spline",[["circle",{cx:"19",cy:"5",r:"2",key:"mhkx31"}],["circle",{cx:"5",cy:"19",r:"2",key:"v8kfzx"}],["path",{d:"M5 17A12 12 0 0 1 17 5",key:"1okkup"}]]);function _o(e,o){const{gl:t,img:r}=e;o=o||{translateX:0,translateY:0,angle:0,scale:0,flipv:0,fliph:0};let{translateX:n,translateY:a,angle:s,scale:i,flipv:h,fliph:p}=o;i+=1;let m=[i,i];const f=[Math.round(t.canvas.width*n*100)/100,Math.round(t.canvas.height*a*100)/100],v=`#version 300 es
        in vec2 vertex;
        uniform mat3 matrix;
        out vec2 texCoord;
        void main() {
          texCoord = vertex;
          gl_Position = vec4((matrix * vec3(vertex, 1)).xy, 0, 1);
        }
      `,u=`#version 300 es
        precision highp float;
        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;   
        void main() {
          outColor = texture(_texture, vec2(texCoord.x, texCoord.y));
        }
      `;if(t.canvas.width===e.height){const C=r.width/r.height;m[0]*=C,m[1]/=C}const y=N.projection(t.canvas.width,t.canvas.height),g=N.translation(f[0],f[1]),w=N.rotation(-s*Math.PI/180),b=N.scaling(m[0]*(-p||1),m[1]*(-h||1));let _=[1,0,0,0,1,0,0,0,1];_=N.multiply(_,y),_=N.multiply(_,g),_=N.multiply(_,N.translation(t.canvas.width/2,t.canvas.height/2)),_=N.multiply(_,w),_=N.multiply(_,b),_=N.multiply(_,N.translation(-t.canvas.width/2,-t.canvas.height/2)),_=N.multiply(_,N.scaling(t.canvas.width,t.canvas.height)),e._.$matrix=e._.$matrix||new U(t,v,u),e.runFilter(e._.$matrix,{matrix:_})}var N={projection:function(e,o){return[2/e,0,0,0,2/o,0,-1,-1,1]},translation:function(e,o){return[1,0,0,0,1,0,e,o,1]},rotation:function(e){var o=Math.cos(e),t=Math.sin(e);return[o,-t,0,t,o,0,0,0,1]},scaling:function(e,o){return[e,0,0,0,o,0,0,0,1]},multiply:function(e,o){var t=e[0],r=e[1],n=e[2],a=e[3],s=e[4],i=e[5],h=e[6],p=e[7],m=e[8],f=o[0],v=o[1],u=o[2],y=o[3],g=o[4],w=o[5],b=o[6],_=o[7],C=o[8];return[f*t+v*a+u*h,f*r+v*s+u*p,f*n+v*i+u*m,y*t+g*a+w*h,y*r+g*s+w*p,y*n+g*i+w*m,b*t+_*a+C*h,b*r+_*s+C*p,b*n+_*i+C*m]}};function yo(e,o,t){const{gl:r}=e;t+=1;const n=`
    vec3 fromLinear(vec3 linearRGB) {
        bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
        vec3 higher = vec3(1.055)*pow(linearRGB.rgb, vec3(1.0/2.4)) - vec3(0.055);
        vec3 lower = linearRGB.rgb * vec3(12.92);
        return vec3(mix(higher, lower, cutoff));
    }
    vec3 toLinear(vec3 sRGB) {
        bvec3 cutoff = lessThan(sRGB.rgb, vec3(0.04045));
        vec3 higher = pow((sRGB.rgb + vec3(0.055))/vec3(1.055), vec3(2.4));
        vec3 lower = sRGB.rgb/vec3(12.92);
        return vec3(mix(higher, lower, cutoff));
    }`;if(o.type==="1"){const a=`#version 300 es
        precision highp float;

        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform sampler2D map;
        uniform float filterStrength;

        ${n}

        vec4 lut(vec4 color) {
          vec3 texel = color.rgb;
          texel = fromLinear(texel);
          float size = 33.0;
          float sliceSize = 1.0 / size;
          float slicePixelSize = sliceSize / size;
          float sliceInnerSize = slicePixelSize * (size - 1.0);
          float xOffset = 0.5 * sliceSize + texel.x * (1.0 - sliceSize);
          float yOffset = 0.5 * slicePixelSize + texel.y * sliceInnerSize;
          float zOffset = texel.z * (size - 1.0);
          float zSlice0 = floor(zOffset);
          float zSlice1 = zSlice0 + 1.0;
          float s0 = yOffset + (zSlice0 * sliceSize);
          float s1 = yOffset + (zSlice1 * sliceSize);
          vec4 slice0Color = texture(map, vec2(xOffset, s0));
          vec4 slice1Color = texture(map, vec2(xOffset, s1));
          texel =  mix(slice0Color, slice1Color, zOffset - zSlice0).rgb;
          texel = toLinear(texel);
          return vec4(texel, color.a);
        }

        void main() {
          vec4 color = texture(_texture, texCoord);
          outColor = color * (1.0 - filterStrength) + lut(color) * filterStrength;
        }
    `;e._.$insta1=e._.$insta1||new U(r,null,a),e._.$instatxt1=e._.$instatxt1||new ee(r),e._.$instatxt1.loadImage(o.map1,r.RGBA),e._.$instatxt1.use(1),e.runFilter(e._.$insta1,{filterStrength:t??1,map:{unit:1}})}else if(o.type==="2"){const a=`#version 300 es
        precision highp float;
        precision highp int;
        
        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform sampler2D map;
        uniform sampler2D map2;
        uniform float filterStrength;

        ${n}

        vec4 lut(vec4 color) {
          vec3 texel = color.rgb;
          texel = fromLinear(texel);
          texel.r = texture(map, vec2(texel.r, 0.5)).r;
          texel.g = texture(map, vec2(texel.g, 0.5)).g;
          texel.b = texture(map, vec2(texel.b, 0.5)).b;
          float luma = dot(vec3(0.2126, 0.7152, 0.0722), texel);
          float shadowCoeff = 0.35 * max(0.0, 1.0 - luma);
          texel = mix(texel, max(vec3(0.0), 2.0 * texel - 1.0), shadowCoeff);
          texel = mix(texel, vec3(luma), -0.3);
          texel.r = texture(map2, vec2(texel.r, 0.5)).r;
          texel.g = texture(map2, vec2(texel.g, 0.5)).g;
          texel.b = texture(map2, vec2(texel.b, 0.5)).b;
          texel = toLinear(texel);
          return vec4(texel, color.a);
        }

        void main() {
          vec4 color = texture(_texture, texCoord);
          color = color * (1.0 - filterStrength) + lut(color) * filterStrength;
          outColor = color;
        }
    `;e._.$insta2=e._.$insta2||new U(r,null,a),e._.$instatxt1=e._.$instatxt1||new ee(r),e._.$instatxt2=e._.$instatxt2||new ee(r),e._.$instatxt1.loadImage(o.map1,r.RGBA),e._.$instatxt2.loadImage(o.map2,r.RGBA),e._.$instatxt1.use(1),e._.$instatxt2.use(2),e.runFilter(e._.$insta2,{filterStrength:t??1,map:{unit:1},map2:{unit:2}})}else if(o.type==="3"){const a=`#version 300 es
        precision highp float;
        precision highp int;
        
        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform sampler2D map;
        uniform sampler2D mapLgg;
        uniform float filterStrength;

        ${n}

        vec4 lut(vec4 color) {
          vec3 texel = color.rgb;
          texel = fromLinear(texel);
          texel = min(texel * 1.1343, vec3(1.0));
          texel.r = texture(map, vec2(texel.r, 0.5)).r;
          texel.g = texture(map, vec2(texel.g, 0.5)).g;
          texel.b = texture(map, vec2(texel.b, 0.5)).b;
          vec3 shadowColor = vec3(0.956862, 0.0, 0.83529);
          float luma = dot(vec3(0.309, 0.609, 0.082), texel);
          vec3 shadowBlend = 2.0 * shadowColor * texel;
          float shadowAmount = 0.6 * max(0.0, (1.0 - 4.0 * luma));
          texel = mix(texel, shadowBlend, shadowAmount);
          vec3 lgg;
          lgg.r = texture(mapLgg, vec2(texel.r, 0.5)).r;
          lgg.g = texture(mapLgg, vec2(texel.g, 0.5)).g;
          lgg.b = texture(mapLgg, vec2(texel.b, 0.5)).b;
          texel = mix(texel, lgg, min(1.0, 0.8 + luma));
          texel = toLinear(texel);
          return vec4(texel, color.a);
        }

        void main() {
          vec4 color = texture(_texture, texCoord);
          outColor = color * (1.0 - filterStrength) + lut(color) * filterStrength;
        }
    `;e._.$insta3=e._.$insta3||new U(r,null,a),e._.$instatxt1=e._.$instatxt1||new ee(r,0,0,r.RGBA,r.UNSIGNED_BYTE),e._.$instatxt1.loadImage(o.map1,r.RGBA),e._.$instatxt2=e._.$instatxt2||new ee(r,0,0,r.RGBA,r.UNSIGNED_BYTE),e._.$instatxt2.loadImage(o.map2,r.RGBA),e._.$instatxt1.use(1),e._.$instatxt2.use(2),e.runFilter(e._.$insta3,{filterStrength:t??1,map:{unit:1},mapLgg:{unit:2}})}else if(o.type==="4"){const a=`#version 300 es
        precision highp float;
        precision highp int;
        
        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform sampler2D map;
        uniform sampler2D map2;
        uniform float filterStrength;

        ${n}

        vec4 lut(vec4 color) {
          vec3 texel = color.rgb;
          texel = fromLinear(texel);
          texel.r = texture(map, vec2(texel.r, 0.5)).r;
          texel.g = texture(map, vec2(texel.g, 0.5)).g;
          texel.b = texture(map, vec2(texel.b, 0.5)).b;
          vec3 desat = vec3(dot(vec3(0.7, 0.2, 0.1), texel));
          texel = mix(texel, desat, 0.79);
          texel = vec3(min(1.0, 1.2 * dot(vec3(0.2, 0.7, 0.1), texel)));
          texel.r = texture(map2, vec2(texel.r, 0.5)).r;
          texel.g = texture(map2, vec2(texel.g, 0.5)).g;
          texel.b = texture(map2, vec2(texel.b, 0.5)).b;
          texel = toLinear(texel);
          return vec4(texel, color.a);
        }

        void main() {
          vec4 color = texture(_texture, texCoord);
          outColor = color * (1.0 - filterStrength) + lut(color) * filterStrength;
        }
    `;e._.$insta4=e._.$insta4||new U(r,null,a),e._.$instatxt1=e._.$instatxt1||new ee(r,0,0,r.RGBA,r.UNSIGNED_BYTE),e._.$instatxt1.loadImage(o.map1,r.RGBA),e._.$instatxt2=e._.$instatxt2||new ee(r,0,0,r.RGBA,r.UNSIGNED_BYTE),e._.$instatxt2.loadImage(o.map2,r.RGBA),e._.$instatxt1.use(1),e._.$instatxt2.use(2),e.runFilter(e._.$insta4,{filterStrength:t??1,map:{unit:1},map2:{unit:2}})}else if(o.type==="MTX"){const a=`#version 300 es
        precision highp float;
        precision highp int;
        
        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform float filterStrength;
        uniform mat4 uColorMatrix;
        uniform vec4 uColorOffset;

        vec4 applyColorMatrix(vec4 c, mat4 m, vec4 o) {
            vec4 res = (c * m) + (o * c.a);
            res = clamp(res, 0.0, 1.0);
            return res;
        }

        void main() {
          vec4 color = texture(_texture, texCoord);
          color = applyColorMatrix(color, uColorMatrix, uColorOffset);
          outColor = color;
        }
    `;let s={identity:[[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0]],polaroid:[[1+.438*t,-.062*t,-.062*t,0,0],[-.122*t,1+.378*t,-.122*t,0,0],[-.016*t,-.016*t,1+.483*t,0,0],[0,0,0,1,0]],kodachrome:[[(1+.1285582396593525*t)*((t/2+1)/2+.5),-.3967382283601348*t,-.03992559172921793*t,0,.06372958762196503*t],[-.16404339962244616*t,(1+.0835251566291304*t)*((t/2+1)/2+.5),-.05498805115633132*t,0,.024732407896706204*t],[-.16786010706155763*t,-.5603416277695248*t,(1+.6014850761964943*t)*((t/2+1)/2+.5),0,.03562982807460946*t],[0,0,0,1,0]],browni:[[(1-.4002976502*t)*((t/1.5+1)/2+.5),.34553243048391263*t,-.2708298674538042*t,0,.09486385711201746*t],[-.037703249837783157*t,(1-.1390422412*t)*((t/1.5+1)/2+.5),.15059552388459913*t,0,-.07393682996638255*t],[.24113635128153335*t,-.07441037908422492*t,(1-.5502781794*t)*((t/1.5+1)/2+.5),0,-.015124150555182566*t],[0,0,0,1,0]],vintage:[[(1-.3720654364*t)*((t/1.5+1)/2+.5),.3202183420819367*t,-.03965408211312453*t,0,.009651285835294123*t],[.02578397704808868*t,(1-.3558811356*t)*((t/1.5+1)/2+.5),.03259127616149294*t,0,.007462829176470591*t],[.0466055556782719*t,-.0851232987247891*t,(1-.4758351981*t)*((t/1.5+1)/2+.5),0,.005159190588235296*t],[0,0,0,1,0]]},i=s.identity,h=[0,0,0,0];t&&(i=Co(i,s[o.mtx],4)),t&&(h=[0,1,2,3].map(f=>h[f]+s[o.mtx][f][4])),e._.$insta5=e._.$insta5||new U(r,null,a);const p=i.flat(),m=h;e.runFilter(e._.$insta5,{uColorMatrix:p,uColorOffset:m})}}function Co(e,o,t=3){let r=[];for(var n=0;n<t;n++){r.push([]);for(var a=0;a<t;a++){r[n].push(0);for(var s=0;s<t;s++)e[n]&&o[s]&&(r[n][a]+=e[n][s]*o[s][a])}}return r}function _t(e){var o=e.length;this.xa=[],this.ya=[],this.u=[],this.y2=[],e.sort(function(i,h){return i[0]-h[0]});for(var t=0;t<o;t++)this.xa.push(e[t][0]),this.ya.push(e[t][1]);this.u[0]=0,this.y2[0]=0;for(var t=1;t<o-1;++t){var r=this.xa[t+1]-this.xa[t-1],n=(this.xa[t]-this.xa[t-1])/r,a=n*this.y2[t-1]+2;this.y2[t]=(n-1)/a;var s=(this.ya[t+1]-this.ya[t])/(this.xa[t+1]-this.xa[t])-(this.ya[t]-this.ya[t-1])/(this.xa[t]-this.xa[t-1]);this.u[t]=(6*s/r-n*this.u[t-1])/a}this.y2[o-1]=0;for(var t=o-2;t>=0;--t)this.y2[t]=this.y2[t]*this.y2[t+1]+this.u[t]}_t.prototype.at=function(e){for(var o=this.ya.length,t=0,r=o-1;r-t>1;){var n=r+t>>1;this.xa[n]>e?r=n:t=n}var a=this.xa[r]-this.xa[t],s=(this.xa[r]-e)/a,i=(e-this.xa[t])/a;return s*this.ya[t]+i*this.ya[r]+((s*s*s-s)*this.y2[t]+(i*i*i-i)*this.y2[r])*(a*a)/6};function He(e){for(var o=new _t(e),t=[],r=0;r<256;r++)t.push(ko(0,Math.floor(o.at(r/255)*256),255));return t}function ko(e,o,t){return Math.max(e,Math.min(o,t))}function So(e,o){if(o.every(h=>h===null))return;o[0]||(o[0]=[[0,0],[1,1]]);let t=o[1]||o[0],r=o[2]||o[0],n=o[3]||o[0];if(t=He(t),r=He(r),n=He(n),t.length!==256||r.length!==256||n.length!==256)return console.error("curves: input unknown");for(var o=[],a=0;a<256;a++)o.splice(o.length,0,t[a],r[a],n[a],255);const s=`#version 300 es
        precision highp float;

        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform sampler2D curvemap;

        void main() {
            vec4 color = texture(_texture, texCoord);
            color.r = texture(curvemap, vec2(color.r)).r;
            color.g = texture(curvemap, vec2(color.g)).g;
            color.b = texture(curvemap, vec2(color.b)).b;
            outColor = color;
        }
      `,{gl:i}=e;e._.$curvestexture=e._.$curvestexture||new ee(i),e._.$curvestexture.initFromBytes(256,1,o,i.RGBA),e._.$curvestexture.use(2),e._.$curves=e._.$curves||new U(i,null,s),e.runFilter(e._.$curves,{curvemap:{unit:2}})}function Ro(e,o,t,r){const n=`#version 300 es
            precision highp float;

            in vec2 texCoord;
            uniform sampler2D _texture;
            uniform vec2 uResolution;
            uniform mat3 matrix;
            uniform bool useTextureSpace;
            out vec4 outColor;

            void main() {
                vec2 coord = texCoord * uResolution;
                if (useTextureSpace) coord = coord / uResolution * 2.0 - 1.0;
                vec3 warp = matrix * vec3(coord, 1.0);
                coord = warp.xy / warp.z;
                if (useTextureSpace) coord = (coord * 0.5 + 0.5) * uResolution;
                vec4 color = texture(_texture, coord / uResolution);
                vec2 clampedCoord = clamp(coord, vec2(0.0), uResolution);
                if (coord != clampedCoord) {
                    //color.a *= max(0.0, 1.0 - length(coord - clampedCoord));
                    color.a = 0.;
                }
                outColor = color;
            }
          `,{gl:a,img:s}=e;if(e._.$warp=e._.$warp||new U(a,null,n),o=Array.prototype.concat.apply([],o),o.length==4)o=[o[0],o[1],0,o[2],o[3],0,0,0,1];else if(o.length!=9)throw"can only warp with 2x2 or 3x3 matrix";const i=[a.canvas.width,a.canvas.height];e.runFilter(e._.$warp,{matrix:t?yt(o):o,uResolution:i,useTextureSpace:r|0})}function To(e,o,t,r,n){o=o.flat(),t=t.flat();var a=dt.apply(null,t),s=dt.apply(null,o),i=Eo(yt(a),s);return Ro(e,i,r,n)}function dt(e,o,t,r,n,a,s,i){var h=t-n,p=r-a,m=s-n,f=i-a,v=e-t+n-s,u=o-r+a-i,y=h*f-m*p,g=(v*f-m*u)/y,w=(h*u-v*p)/y;return[t-e+g*t,r-o+g*r,g,s-e+w*s,i-o+w*i,w,e,o,1]}function yt(e){var o=e[0],t=e[1],r=e[2],n=e[3],a=e[4],s=e[5],i=e[6],h=e[7],p=e[8],m=o*a*p-o*s*h-t*n*p+t*s*i+r*n*h-r*a*i;return[(a*p-s*h)/m,(r*h-t*p)/m,(t*s-r*a)/m,(s*i-n*p)/m,(o*p-r*i)/m,(r*n-o*s)/m,(n*h-a*i)/m,(t*i-o*h)/m,(o*a-t*n)/m]}function Eo(e,o){return[e[0]*o[0]+e[1]*o[3]+e[2]*o[6],e[0]*o[1]+e[1]*o[4]+e[2]*o[7],e[0]*o[2]+e[1]*o[5]+e[2]*o[8],e[3]*o[0]+e[4]*o[3]+e[5]*o[6],e[3]*o[1]+e[4]*o[4]+e[5]*o[7],e[3]*o[2]+e[4]*o[5]+e[5]*o[8],e[6]*o[0]+e[7]*o[3]+e[8]*o[6],e[6]*o[1]+e[7]*o[4]+e[8]*o[7],e[6]*o[2]+e[7]*o[5]+e[8]*o[8]]}function $o(e,o,t){const{gl:r}=e,n=`#version 300 es
        precision highp float;

        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform sampler2D map;
        uniform float filterStrength;

        vec4 fromLinear(vec4 linearRGB) {
            bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
            vec3 higher = vec3(1.055)*pow(linearRGB.rgb, vec3(1.0/2.4)) - vec3(0.055);
            vec3 lower = linearRGB.rgb * vec3(12.92);
            return vec4(mix(higher, lower, cutoff), linearRGB.a);
        }
        vec4 toLinear(vec4 sRGB) {
            bvec3 cutoff = lessThan(sRGB.rgb, vec3(0.04045));
            vec3 higher = pow((sRGB.rgb + vec3(0.055))/vec3(1.055), vec3(2.4));
            vec3 lower = sRGB.rgb/vec3(12.92);
            return vec4(mix(higher, lower, cutoff), sRGB.a);
        }

        void main(){
          vec4 color = texture(_texture, texCoord);
          vec4 texc = texture(map, texCoord);
          color = toLinear(color);
          texc = toLinear(texc);
          color = mix(color, texc, filterStrength);
          color = fromLinear(color);
          outColor = color;
        }`;e._.$blend=e._.$blend||new U(r,null,n),e._.$blendtxt=e._.$blendtxt||new ee(r),e._.$blendtxt.loadImage(o),e._.$blendtxt.use(1),e.runFilter(e._.$blend,{filterStrength:t??1,map:{unit:1}})}function Mo(e,o){const t=`#version 300 es
        //Bokeh disc. by David Hoskins.
        //https://www.shadertoy.com/view/4d2Xzw
        precision highp float;

        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform float bokehstrength;
        uniform float bokehlensin;
        uniform float bokehlensout;
        uniform float centerX;
        uniform float centerY;

        #define GOLDEN_ANGLE 2.39996323
        #define ITERATIONS 512
        const mat2 rot = mat2(cos(GOLDEN_ANGLE), sin(GOLDEN_ANGLE), -sin(GOLDEN_ANGLE), cos(GOLDEN_ANGLE));
        vec3 Bokeh(sampler2D tex, vec2 uv, float radius)
        {
          vec3 acc = vec3(0), div = acc;
            float r = 1.;
            vec2 vangle = vec2(0.0,radius*.01 / sqrt(float(ITERATIONS)));
            
          for (int j = 0; j < ITERATIONS; j++)
            {  
                // the approx increase in the scale of sqrt(0, 1, 2, 3...)
                r += 1. / r;
              vangle = rot * vangle;
                vec3 col = texture(tex, uv + (r-1.) * vangle).xyz; /// ... Sample the image
                //col = col * col *1.8; // ... Contrast it for better highlights - leave this out elsewhere.
            vec3 bokeh = pow(col, vec3(4));
            acc += col * bokeh;
            div += bokeh;
          }
          return acc / div;
        }


        void main() {
            vec4 color = texture(_texture, texCoord);
            vec4 bcolor = vec4(Bokeh(_texture, texCoord, bokehstrength), 1.);
    
            //vignette used to control alpha
            //to blur inside circle smoothstep(lensin, lensout, dist)
            //to blur outside circle smoothstep(lensout, lensin, dist)
            float dist = distance(texCoord.xy, vec2(centerX,centerY));
            float vigfin = pow(1.-smoothstep(max(0.001,bokehlensout), bokehlensin, dist),2.);

            outColor = mix( color, bcolor, vigfin);
        }
      `,{gl:r}=e;let{bokehstrength:n=.5,bokehlensin:a=0,bokehlensout:s=.5,centerX:i=0,centerY:h=0}=o||{};e._.$lensblur=e._.$lensblur||new U(r,null,t),e.runFilter(e._.$lensblur,{bokehstrength:n,bokehlensin:a,bokehlensout:s,centerX:i,centerY:h})}function Ao(e,o){const t=`#version 300 es
        //https://www.shadertoy.com/view/XdfGDH
        precision highp float;

        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform vec2 uResolution;
        uniform float gaussianstrength;
        uniform float gaussianlensin;
        uniform float gaussianlensout;
        uniform float centerX;
        uniform float centerY;

        float normpdf(in float x, in float sigma)
        {
          return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;
        }

        void main() {
            vec4 color = texture(_texture, texCoord);

            //declare stuff
            const int mSize = 11;
            const int kSize = (mSize-1)/2;
            float kernel[mSize];
            vec3 final_colour = vec3(0.0);
            
            //create the 1-D kernel
            float sigma = 7.0*gaussianstrength;
            float Z = 0.0;
            for (int j = 0; j <= kSize; ++j)
            {
              kernel[kSize+j] = kernel[kSize-j] = normpdf(float(j), sigma);
            }
            
            //get the normalization factor (as the gaussian has been clamped)
            for (int j = 0; j < mSize; ++j)
            {
              Z += kernel[j];
            }
            
            //read out the texels
            for (int i=-kSize; i <= kSize; ++i)
            {
              for (int j=-kSize; j <= kSize; ++j)
              {
                final_colour += kernel[kSize+j]*kernel[kSize+i]*texture(_texture, (texCoord.xy+vec2(float(i),float(j))/uResolution)).rgb;
              }
            }
            
            //vignette used to control alpha
            //to blur inside circle smoothstep(lensin, lensout, dist)
            //to blur outside circle smoothstep(lensout, lensin, dist)
            float dist = distance(texCoord.xy, vec2(centerX,centerY));
            float vigfin = pow(1.-smoothstep(max(0.001,gaussianlensout), gaussianlensin, dist),2.);

            outColor = mix( color, vec4(final_colour/(Z*Z), 1.0), vigfin);
        }
      `,{gl:r}=e;let{gaussianstrength:n=.5,gaussianlensin:a=0,gaussianlensout:s=.5,centerX:i=0,centerY:h=0}=o||{};const p=[r.canvas.width,r.canvas.height];e._.$gaussianblur=e._.$gaussianblur||new U(r,null,t),e.runFilter(e._.$gaussianblur,{gaussianstrength:n,gaussianlensin:a,gaussianlensout:s,centerX:i,centerY:h,uResolution:p})}function Bo(e,o){const t=`#version 300 es
        precision highp float;

        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform vec2 uTextureSize;
        uniform mat4 uColorMatrix;
        uniform vec4 uColorOffset;
        uniform float uClarityKernel[9];
        uniform float uClarityKernelWeight;
        uniform float uColorGamma;
        uniform float uVibrance;
        uniform float uColorVignette;
        uniform vec2 uVignettePos;
        uniform float vibrance;

        vec4 applyGamma(vec4 c, float g) {
            c.r = pow(c.r, g);
            c.g = pow(c.g, g);
            c.b = pow(c.b, g);
            return c;
        }
        vec4 applyVibrance(vec4 c, float v){
          float max = max(c.r, max(c.g, c.b));
          float avg = (c.r + c.g + c.b) / 3.0;
          float amt = (abs(max - avg) * 2.0) * -v;
          c.r += max != c.r ? (max - c.r) * amt : 0.00;
          c.g += max != c.g ? (max - c.g) * amt : 0.00;
          c.b += max != c.b ? (max - c.b) * amt : 0.00;
          return c;
        }
        vec4 applyColorMatrix(vec4 c, mat4 m, vec4 o) {
            vec4 res = (c * m) + (o * c.a);
            res = clamp(res, 0.0, 1.0);
            return res;
        }
        vec4 applyConvolutionMatrix(vec4 c, float k0, float k1, float k2, float k3, float k4, float k5, float k6, float k7, float k8, float w) {
          vec2 pixel = vec2(1) / uTextureSize;
          vec4 colorSum = texture(_texture, texCoord - pixel) * k0 + texture(_texture, texCoord + pixel * vec2(0.0, -1.0)) * k1 + texture(_texture, texCoord + pixel * vec2(1.0, -1.0)) * k2 + texture(_texture, texCoord + pixel * vec2(-1.0, 0.0)) * k3 + texture(_texture, texCoord) * k4 + texture(_texture, texCoord + pixel * vec2(1.0, 0.0)) * k5 + texture(_texture, texCoord + pixel * vec2(-1.0, 1.0)) * k6 + texture(_texture, texCoord + pixel * vec2(0.0, 1.0)) * k7 + texture(_texture, texCoord + pixel) * k8;
          vec4 color = vec4(clamp((colorSum / w), 0.0, 1.0).rgb, c.a);
          return color;
        }

        vec4 applyVignette2(vec4 c, vec2 pos, float v, vec2 upos){
          #define inner .20
          #define outer 1.1
          #define curvature .65
          vec2 curve = pow(abs(pos),vec2(1./curvature));
          float edge = pow(length(curve),curvature);
          float scale = 1.-abs(upos.x);
          float vignette = 1.-v*smoothstep(inner*scale,outer*scale,edge);
          vec4 color = vec4(c.rgb *= vignette , c.a);
          return color;
        }

        vec4 vignette3(vec4 c, vec2 pos, float radius)
        {
            float ambientlight = 0.14;
            float circle = length(pos) - radius;
            float v = 1.0 - smoothstep(0.0, 0.4f, circle) + ambientlight;
            return vec4(c.rgb*v,c.a);
        }

        void main() {
          vec4 color = texture(_texture, texCoord);
          if (uClarityKernelWeight != -1.0) { 
            color = applyConvolutionMatrix(color, uClarityKernel[0], uClarityKernel[1], uClarityKernel[2], uClarityKernel[3], uClarityKernel[4], uClarityKernel[5], uClarityKernel[6], uClarityKernel[7], uClarityKernel[8], uClarityKernelWeight); 
          } 
          color = applyGamma(color, uColorGamma);
          color = applyVibrance(color, uVibrance);
          color = applyColorMatrix(color, uColorMatrix, uColorOffset);
          if (uColorVignette != 0.0) {
            vec2 pos = texCoord.xy*2.-1. - uVignettePos;
            //color = vignette3(color, pos, uColorVignette);
            color = applyVignette2(color, pos, uColorVignette, uVignettePos);
          }
          outColor = color;
        }
      `,{gl:r}=e;let n=[0,0],{brightness:a=0,contrast:s=0,saturation:i=0,exposure:h=0,temperature:p=0,gamma:m=0,clarity:f=0,vibrance:v=0,vignette:u=0,tint:y=0,sepia:g=0}=o;a=a/4,s=(s+1)/2+.5,i=i+1,h=((h>0?h*3:h*1.5)+1)/2+.5,m+=1,p*=2,y*=2;let w={brightness:[[1,0,0,0,a],[0,1,0,0,a],[0,0,1,0,a],[0,0,0,1,0]],contrast:[[s,0,0,0,.5*(1-s)],[0,s,0,0,.5*(1-s)],[0,0,s,0,.5*(1-s)],[0,0,0,1,0]],saturation:[[.213+.787*i,.715-.715*i,.072-.072*i,0,0],[.213-.213*i,.715+.285*i,.072-.072*i,0,0],[.213-.213*i,.715-.715*i,.072+.928*i,0,0],[0,0,0,1,0]],exposure:[[h,0,0,0,0],[0,h,0,0,0],[0,0,h,0,0],[0,0,0,1,0]],temperature:p>0?[[1+.1*p,0,0,0,0],[0,1,0,0,0],[0,0,1+.1*-p,0,0],[0,0,0,1,0]]:[[1+.15*p,0,0,0,0],[0,1+.05*p,0,0,0],[0,0,1+.15*-p,0,0],[0,0,0,1,0]],tint:[[1,0,0,0,0],[0,1+.1*y,0,0,0],[0,0,1,0,0],[0,0,0,1,0]],sepia:[[1-.607*g,.769*g,.189*g,0,0],[.349*g,1-.314*g,.168*g,0,0],[.272*g,.534*g,1-.869*g,0,0],[0,0,0,1,0]],identity:[[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0]]},b=w.identity,_=[0,0,0,0];b=fe(b,w.brightness,4),_=[0,1,2,3].map(I=>_[I]+w.brightness[I][4]),b=fe(b,w.contrast,4),_=[0,1,2,3].map(I=>_[I]+w.contrast[I][4]),b=fe(b,w.saturation,4),b=fe(b,w.exposure,4),b=fe(b,w.temperature,4),b=fe(b,w.tint,4),b=fe(b,w.sepia,4);let C=f>=0?[0,-1*f,0,-1*f,1+4*f,-1*f,0,-1*f,0]:[-1*f,-2*f,-1*f,-2*f,1+-3*f,-2*f,-1*f,-2*f,-1*f],z=C.reduce(((I,te)=>I+te),0);z=z<=0?1:z,C=[C];const V=b.flat(),H=_,P=[r.canvas.width,r.canvas.height],ce=v,W=u,T=C,M=z,G=n;e._.$adj=e._.$adj||new U(r,null,t),e.runFilter(e._.$adj,{uColorMatrix:V,uColorOffset:H,uColorGamma:1/m,uClarityKernel:T,uClarityKernelWeight:M,uTextureSize:P,uVibrance:ce,uColorVignette:W,uVignettePos:G})}function zo(e,o,t){const r=`#version 300 es
        precision highp float;

        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform float shadows;
        uniform float highlights;

        const mediump vec3 luminanceWeighting = vec3(0.2125, 0.7154, 0.0721);

        void main() {
          vec4 color = texture(_texture, texCoord);

          float luminance = dot(color.rgb, luminanceWeighting);
          float shadow = clamp((pow(luminance, 1.0/shadows) + (-0.76)*pow(luminance, 2.0/shadows)) - luminance, 0.0, 1.0);
          float highlight = clamp((1.0 - (pow(1.0-luminance, 1.0/(2.0-highlights)) + (-0.8)*pow(1.0-luminance, 2.0/(2.0-highlights)))) - luminance, -1.0, 0.0);
          vec3 result = vec3(0.0, 0.0, 0.0) + (luminance + shadow + highlight) * ((color.rgb - vec3(0.0, 0.0, 0.0))/luminance );

          // blend toward white if highlights is more than 1
          float contrastedLuminance = ((luminance - 0.5) * 1.5) + 0.5;
          float whiteInterp = contrastedLuminance*contrastedLuminance*contrastedLuminance;
          float whiteTarget = clamp(highlights, 0.0, 2.0) - 1.0;
          result = mix(result, vec3(1.0), whiteInterp*whiteTarget);

          // blend toward black if shadows is less than 1
          float invContrastedLuminance = 1.0 - contrastedLuminance;
          float blackInterp = invContrastedLuminance*invContrastedLuminance*invContrastedLuminance;
          float blackTarget = 1.0 - clamp(shadows, 0.0, 1.0);
          result = mix(result, vec3(0.0), blackInterp*blackTarget);

          outColor = vec4(result, color.a);
        }
  `,{gl:n}=e;e._.$sg=e._.$sg||new U(n,null,r),e.runFilter(e._.$sg,{highlights:o+1,shadows:t/2+1})}function Io(e,o){const t=`#version 300 es
        precision highp float;

        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform vec2 uResolution;
        uniform float filterStrength;


        vec4 BlurColor (in vec2 Coord, in sampler2D Tex, in float MipBias)
        {
            vec2 TexelSize = MipBias/uResolution.xy;
            vec4  Color = texture(Tex, Coord, MipBias);
            Color += texture(Tex, Coord + vec2(TexelSize.x,0.0), MipBias);      
            Color += texture(Tex, Coord + vec2(-TexelSize.x,0.0), MipBias);     
            Color += texture(Tex, Coord + vec2(0.0,TexelSize.y), MipBias);      
            Color += texture(Tex, Coord + vec2(0.0,-TexelSize.y), MipBias);     
            Color += texture(Tex, Coord + vec2(TexelSize.x,TexelSize.y), MipBias);      
            Color += texture(Tex, Coord + vec2(-TexelSize.x,TexelSize.y), MipBias);     
            Color += texture(Tex, Coord + vec2(TexelSize.x,-TexelSize.y), MipBias);     
            Color += texture(Tex, Coord + vec2(-TexelSize.x,-TexelSize.y), MipBias);    
            return Color/9.0;
        }

        void main() {
          float Threshold = 0.4;
          float Intensity = filterStrength*1.0;
          float BlurSize = 3.0 * Intensity;

          vec4 color = texture(_texture, texCoord);
          vec4 Highlight = clamp(BlurColor(texCoord.xy, _texture, BlurSize)-Threshold,0.0,1.0)*1.0/(1.0-Threshold);
          outColor = 1.0-(1.0-color)*(1.0-Highlight*Intensity); //Screen Blend Mode
        }
  `,{gl:r}=e,n=[r.canvas.width,r.canvas.height];e._.$bloom=e._.$bloom||new U(r,null,t),e.runFilter(e._.$bloom,{filterStrength:o,uResolution:n})}function Do(e,o){const t=`#version 300 es
        precision highp float;

        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        uniform vec2 uResolution;
        uniform float filterStrength;

        #define SIGMA 10.0
        #define BSIGMA 0.1
        #define MSIZE 15

        float normpdf(in float x, in float sigma)
        {
          return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;
        }

        float normpdf3(in vec3 v, in float sigma)
        {
          return 0.39894*exp(-0.5*dot(v,v)/(sigma*sigma))/sigma;
        }

        vec4 applyFilter(vec4 c, sampler2D _texture, vec2 texCoord) {

          const int kSize = (MSIZE-1)/2;
          float kernel[MSIZE] = float[MSIZE](0.031225216, 0.033322271, 0.035206333, 0.036826804, 0.038138565, 0.039104044, 0.039695028, 0.039894000, 0.039695028, 0.039104044, 0.038138565, 0.036826804, 0.035206333, 0.033322271, 0.031225216);
          vec3 final_colour = vec3(0.0);
          
          vec3 cc;
          float factor;
          float Z = 0.0;
          float bZ = 1.0/normpdf(0.0, BSIGMA);
          for (int i=-kSize; i <= kSize; ++i)
          {
            for (int j=-kSize; j <= kSize; ++j)
            {
              cc = texture(_texture, (texCoord.xy+vec2(float(i),float(j))/uResolution)).rgb;
              factor = normpdf3(cc-c.rgb, BSIGMA)*bZ*kernel[kSize+j]*kernel[kSize+i];
              Z += factor;
              final_colour += factor*cc;
            }
          }
          
          return vec4(final_colour/Z, 1.0);
        }

        void main() {
          vec4 color = texture(_texture, texCoord);
          color = color * (1.0 - filterStrength) + applyFilter(color, _texture, texCoord) * filterStrength;
          outColor = color;
        }
  `,{gl:r}=e,n=[r.canvas.width,r.canvas.height];e._.$noise=e._.$noise||new U(r,null,t),e.runFilter(e._.$noise,{filterStrength:o,uResolution:n})}function fe(e,o,t=3){let r=[];for(var n=0;n<t;n++){r.push([]);for(var a=0;a<t;a++){r[n].push(0);for(var s=0;s<t;s++)e[n]&&o[s]&&(r[n][a]+=e[n][s]*o[s][a])}}return r}const ft=Object.freeze(Object.defineProperty({__proto__:null,filterAdjustments:Bo,filterBlend:$o,filterBloom:Io,filterBlurBokeh:Mo,filterBlurGaussian:Ao,filterCurves:So,filterHighlightsShadows:zo,filterInsta:yo,filterMatrix:_o,filterNoise:Do,filterPerspective:To},Symbol.toStringTag,{value:"Module"}));function Lo(e,o,t){let r=e.getContext("webgl2",{antialias:!1,premultipliedAlpha:!0});if(!r)return console.error("webgl2 not supported!");r.drawingBufferColorSpace="srgb",r.unpackColorSpace="srgb";const n={width:0,height:0,gl:r,img:o,destroy:f,loadImage:y,paintCanvas:g,crop:V,resetCrop:H,resize:b,resetResize:_,captureImage:P,readPixels:ce,runFilter:u,setupFiltersTextures:m,_:{}};r.canvas.width=n.width=o.naturalWidth,r.canvas.height=n.height=o.naturalHeight;const a=new ee(r);a.loadImage(o);const s=new U(r),i=new U(r,null,Po);let h,p=0;function m(){h?.length&&h.forEach(M=>M.destroy()),h=[];for(var T=0;T<2;++T){const M=new ee(r,r.canvas.width,r.canvas.height);h.push(M)}}m();function f(){h?.length&&h.forEach(T=>T.destroy()),C&&C.destroy(),a.destroy(),delete n.img_cropped}let v;function u(T,M){M&&T.uniforms(M),v&&v.use(),h[p%2].drawTo(),T.drawRect(),v=h[p%2],p++}function y(){C?v=C:v=a,u(s,null)}function g(){v&&v.use(),r.bindFramebuffer(r.FRAMEBUFFER,null),i.drawRect()}let w={width:0,height:0};function b(T,M){r.canvas.width=n.width=w.width=T,r.canvas.height=n.height=w.height=M,m()}function _(){w.width&&(w.width=w.height=0,r.canvas.width=n.width=z.width||o.naturalWidth,r.canvas.height=n.height=z.height||o.naturalHeight,m())}let C,z={width:0,height:0};function V({left:T,top:M,width:G,height:I}){const te=G*I*4,B=new Uint8Array(te);u(s,{}),r.readPixels(T,M,G,I,r.RGBA,r.UNSIGNED_BYTE,B);const O=r.unpackColorSpace,q=new ImageData(new Uint8ClampedArray(B.buffer),G,I,{colorSpace:O});C=new ee(r),C.loadImage(q),r.canvas.width=n.width=z.width=G,r.canvas.height=n.height=z.height=I,m(),n.img_cropped=vt(q,O)}function H(){C&&(C.destroy(),C=null,z.width=z.height=0,r.canvas.width=n.width=w.width||o.naturalWidth,r.canvas.height=n.height=w.height||o.naturalHeight,delete n.img_cropped,m())}function P(T,M){u(s,{});const{width:G,height:I}=r.canvas,te=G*I*4,B=new Uint8Array(te);r.readPixels(0,0,G,I,r.RGBA,r.UNSIGNED_BYTE,B);const O=r.unpackColorSpace,q=new ImageData(new Uint8ClampedArray(B.buffer),G,I,{colorSpace:O});return vt(q,O,T,M)}function ce(){u(s,{});const{width:T,height:M}=r.canvas,G=T*M*4,I=new Uint8Array(G);return r.readPixels(0,0,T,M,r.RGBA,r.UNSIGNED_BYTE,I),I}function W(T){return function(...M){T(n,...M)}}return Object.keys(ft).forEach(T=>n[T]=W(ft[T])),n}const Po=`#version 300 es
        precision highp float;
        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;

        vec4 fromLinear(vec4 linearRGB) {
            bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
            vec3 higher = vec3(1.055)*pow(linearRGB.rgb, vec3(1.0/2.4)) - vec3(0.055);
            vec3 lower = linearRGB.rgb * vec3(12.92);
            return vec4(mix(higher, lower, cutoff), linearRGB.a);
        }

        void main() {
            vec4 color = texture(_texture, vec2(texCoord.x, 1.0 - texCoord.y));
            //outColor = color;
            outColor = fromLinear(color);
        }`;function U(e,o,t){const r=`#version 300 es
        in vec2 vertex;
        out vec2 texCoord;

        void main() {
          texCoord = vertex;
          gl_Position = vec4(vertex * 2.0 - 1.0, 0.0, 1.0);
        }
      `,n=`#version 300 es
        precision highp float;

        in vec2 texCoord;
        uniform sampler2D _texture;
        out vec4 outColor;   

        void main() {
          outColor = texture(_texture, texCoord);
        }
      `,a=e.createProgram();let s;e.attachShader(a,p(e,e.VERTEX_SHADER,o||r)),e.attachShader(a,p(e,e.FRAGMENT_SHADER,t||n)),e.linkProgram(a);function i(m=!0,f,v,u,y){const g=e.getParameter(e.VIEWPORT);f=f!==void 0?(f-g[0])/g[2]:0,v=v!==void 0?(v-g[1])/g[3]:0,u=u!==void 0?(u-g[0])/g[2]:1,y=y!==void 0?(y-g[1])/g[3]:1,e.useProgram(a),e.vertexBuffer=e.vertexBuffer||e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,e.vertexBuffer),e.bufferData(e.ARRAY_BUFFER,new Float32Array([f,v,f,y,u,v,u,y]),e.STATIC_DRAW),s||(s=e.getAttribLocation(a,"vertex"),e.enableVertexAttribArray(s)),e.vertexAttribPointer(s,2,e.FLOAT,!1,0,0),m&&(e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT|e.GL_DEPTH_BUFFER_BIT)),e.drawArrays(e.TRIANGLE_STRIP,0,4)}function h(m={}){e.useProgram(a);for(let f in m){const v=e.getUniformLocation(a,f);if(v===null)continue;let u=m[f];if(Array.isArray(u))switch(u.length){case 1:{Array.isArray(u[0])&&(u=u[0]),e.uniform1fv(v,new Float32Array(u));break}case 2:e.uniform2fv(v,new Float32Array(u));break;case 3:e.uniform3fv(v,new Float32Array(u));break;case 4:e.uniform4fv(v,new Float32Array(u));break;case 9:e.uniformMatrix3fv(v,!1,new Float32Array(u));break;case 16:e.uniformMatrix4fv(v,!1,new Float32Array(u));break;default:throw`dont't know how to load uniform "`+f+'" of length '+u.length}else if(u?.unit)e.uniform1i(v,u.unit);else if(typeof u=="number")e.uniform1f(v,u);else throw'attempted to set uniform "'+f+'" to invalid value '+(u||"undefined").toString()}}function p(m,f,v){var u=m.createShader(f);if(m.shaderSource(u,v),m.compileShader(u),!m.getShaderParameter(u,m.COMPILE_STATUS))throw"compile error: "+m.getShaderInfoLog(u);return u}return{drawRect:i,uniforms:h}}function ee(e,o,t){let r=o,n=t,a=e.createTexture();e.bindTexture(e.TEXTURE_2D,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const s=e.SRGB8_ALPHA8;o&&t&&e.texImage2D(e.TEXTURE_2D,0,s,o,t,0,e.RGBA,e.UNSIGNED_BYTE,null);function i(v=0){if(!a)return console.error("texture has been destroyed");e.activeTexture(e.TEXTURE0+v),e.bindTexture(e.TEXTURE_2D,a)}function h(){e.deleteTexture(a),a=null}function p(){if(!a)return console.error("texture has been destroyed");if(e.framebuffer=e.framebuffer||e.createFramebuffer(),e.bindFramebuffer(e.FRAMEBUFFER,e.framebuffer),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,a,0),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE)throw new Error("incomplete framebuffer");e.viewport(0,0,r,n)}function m(v,u){if(!a)return console.error("texture has been destroyed");r=v.naturalWidth,n=v.naturalHeight,e.bindTexture(e.TEXTURE_2D,a);let y=u||e.SRGB8_ALPHA8;e.texImage2D(e.TEXTURE_2D,0,y,e.RGBA,e.UNSIGNED_BYTE,v)}function f(v,u,y,g){r=v,n=u,e.bindTexture(e.TEXTURE_2D,a);let w=g||e.SRGB8_ALPHA8;e.texImage2D(e.TEXTURE_2D,0,w,v,u,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array(y))}return{use:i,destroy:h,drawTo:p,loadImage:m,initFromBytes:f}}function vt(e,o,t,r){const n=document.createElement("canvas");var a=n.getContext("2d",{colorSpace:o});n.width=e.width,n.height=e.height,a.putImageData(e,0,0);var s=new Image;return s.src=n.toDataURL(t,r),s}const Fo={class:"grid grid-cols-[6.5rem_minmax(0,1fr)_3rem] items-center gap-2 py-0.5 text-xs"},Go={class:"truncate text-fg-muted"},Vo=["value","min","max","step"],pe=Le({__name:"PhotoSlider",props:Ie({label:{},min:{default:-1},max:{default:1},step:{default:.01},reset:{default:0},digits:{default:2}},{modelValue:{required:!0},modelModifiers:{}}),emits:["update:modelValue"],setup(e){const o=Ze(e,"modelValue");return(t,r)=>(k(),R("label",Fo,[x("span",Go,E(e.label),1),x("input",{type:"range",value:o.value,min:e.min,max:e.max,step:e.step,class:"w-full cursor-pointer accent-accent",onInput:r[0]||(r[0]=n=>o.value=Number(n.target.value)),onDblclick:r[1]||(r[1]=n=>o.value=e.reset)},null,40,Vo),x("span",{class:oe(["text-right font-mono tabular-nums",o.value===e.reset?"text-fg-faint":"text-fg"])},E(o.value.toFixed(e.digits)),3)]))}}),Uo=["brightness","exposure","gamma","contrast","shadows","highlights","bloom"],Oo=["temperature","tint","vibrance","saturation","sepia"],jo=["clarity","noise","vignette"],De={lights:Uo,colors:Oo,effects:jo};function ht(){const e={};for(const o of Object.values(De))for(const t of o)e[t]=0;return e}function No(e,o){return De[o].every(t=>e[t]===0)}const F=(e,o,t)=>Math.min(t,Math.max(o,e));function Xo(e,o){return((e+o)%360+360)%360}function mt(e,o,t){return t%180?{width:o,height:e}:{width:e,height:o}}function Ho(e,o,t){const r=Math.abs(t)*Math.PI/180,n=e*Math.cos(r)+o*Math.sin(r),a=e*Math.sin(r)+o*Math.cos(r);return Math.max(n/e-1,a/o-1)}const ze={x:0,y:0,w:1,h:1},Yo=["free","original","1:1","4:3","16:9","3:4","9:16"];function Ko(e,o,t){if(e==="free")return null;if(e==="original")return o/t;const[r,n]=e.split(":").map(Number);return r/n}function Wo(e,o,t){return e*t/o}function pt(e){if(e===null)return{...ze};const o=e>=1?1:e,t=e>=1?1/e:1;return{x:(1-o)/2,y:(1-t)/2,w:o,h:t}}function qo(e,o=1e-6){return e.x<o&&e.y<o&&e.w>1-o&&e.h>1-o}function Zo(e,o,t){return{...e,x:F(e.x+o,0,1-e.w),y:F(e.y+t,0,1-e.h)}}function Jo(e,o,t,r,n,a=.05){const s=o.includes("w"),i=o.includes("e"),h=o.includes("n"),p=o.includes("s");if(n===null){let _=e.x,C=e.y,z=e.x+e.w,V=e.y+e.h;return s&&(_=F(_+t,0,z-a)),i&&(z=F(z+t,_+a,1)),h&&(C=F(C+r,0,V-a)),p&&(V=F(V+r,C+a,1)),{x:_,y:C,w:z-_,h:V-C}}const m=s?e.x+e.w:e.x,f=h?e.y+e.h:e.y,v=s?m:1-m,u=h?f:1-f,y=s?-t:t,g=h?-r:r;let w=Math.abs(y)>=Math.abs(g)*n?e.w+y:(e.h+g)*n;w=Math.max(w,a,a*n);let b=w/n;return w>v&&(w=v,b=w/n),b>u&&(b=u,w=b*n),{x:s?m-w:m,y:h?f-b:f,w,h:b}}function xt(e,o,t){const r=F(Math.round(e.x*o),0,o-1),n=F(Math.round(e.y*t),0,t-1);return{left:r,top:n,width:F(Math.round(e.w*o),1,o-r),height:F(Math.round(e.h*t),1,t-n)}}function Qo(e,o,t,r=16,n=16384){if(e==="width"){const s=Math.round(F(o,r,n));return{width:s,height:Math.max(1,Math.round(s/t))}}const a=Math.round(F(o,r,n));return{width:Math.max(1,Math.round(a*t)),height:a}}const qe=["rgb","red","green","blue"],er=5,gt=.05;function _e(e=er){return Array.from({length:e},(o,t)=>[t/(e-1),t/(e-1)])}function Ct(e,o=1e-6){return e.every(([t,r])=>Math.abs(t-r)<o)}function Ye(e,o,t,r){const n=e.length-1,a=o===0?0:o===n?1:F(t,e[o-1][0]+gt,e[o+1][0]-gt);return e.map((s,i)=>i===o?[a,F(r,0,1)]:[s[0],s[1]])}const tr=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4,or=e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055;function rr(e){const o=kt(e);return Array.from({length:256},(t,r)=>{const n=r/255;return[n,tr(F(o(or(n)),0,1))]})}function nr(e){const o=qe.map(t=>Ct(e[t])?null:rr(e[t]));return o.every(t=>t===null)?null:o}function kt(e){const o=[...e].sort((i,h)=>i[0]-h[0]),t=o.length,r=o.map(i=>i[0]),n=o.map(i=>i[1]),a=new Array(t).fill(0),s=new Array(t).fill(0);for(let i=1;i<t-1;i++){const h=(r[i]-r[i-1])/(r[i+1]-r[i-1]),p=h*a[i-1]+2;a[i]=(h-1)/p;const m=(n[i+1]-n[i])/(r[i+1]-r[i])-(n[i]-n[i-1])/(r[i]-r[i-1]);s[i]=(6*m/(r[i+1]-r[i-1])-h*s[i-1])/p}a[t-1]=0;for(let i=t-2;i>=0;i--)a[i]=a[i]*a[i+1]+s[i];return i=>{let h=0,p=t-1;for(;p-h>1;){const u=p+h>>1;r[u]>i?p=u:h=u}const m=r[p]-r[h],f=(r[p]-i)/m,v=(i-r[h])/m;return f*n[h]+v*n[p]+((f*f*f-f)*a[h]+(v*v*v-v)*a[p])*(m*m/6)}}function ar(e,o,t=64){const r=kt(e),n=[];for(let a=0;a<=t;a++){const s=a/t,i=F(r(s),0,1);n.push(`${a?"L":"M"}${(s*o).toFixed(2)} ${((1-i)*o).toFixed(2)}`)}return n.join(" ")}function lr(e){const o=new Uint32Array(256),t=new Uint32Array(256),r=new Uint32Array(256),n=new Uint32Array(256);for(let a=0;a+3<e.length;a+=4){if(e[a+3]===0)continue;const s=e[a],i=e[a+1],h=e[a+2];o[s]++,t[i]++,r[h]++,n[Math.round(.2126*s+.7152*i+.0722*h)]++}return{r:o,g:t,b:r,l:n}}function Ke(e,o,t,r){if(r<=0)return"";const n=o/255,a=[`M0 ${t}`];for(let s=0;s<256;s++)a.push(`L${(s*n).toFixed(2)} ${(t-Math.min(1,e[s]/r)*t).toFixed(2)}`);return a.push(`L${o} ${t}Z`),a.join(" ")}function ir(e){const o=[...e.r,...e.g,...e.b].sort((t,r)=>t-r);return o[Math.floor(o.length*.995)]||o[o.length-1]||0}const sr=["jpeg","png","webp"],ur={jpeg:"jpg",png:"png",webp:"webp"};function cr(e,o){return`${e.replace(/\.[^./\\]+$/,"")||"image"}-edited.${ur[o]}`}const dr=["viewBox","aria-label"],fr={class:"stroke-line-strong","stroke-width":"1"},vr=["x1","x2"],hr=["y1","y2"],mr=["d"],pr=["cx","cy","r","aria-label","onKeydown"],Y=256,xr=Le({__name:"PhotoCurveEditor",props:Ie({label:{},colorClass:{}},{modelValue:{required:!0},modelModifiers:{}}),emits:Ie(["reset"],["update:modelValue"]),setup(e,{emit:o}){const t=Ze(e,"modelValue"),r=o,n=$(null),a=$(null),s=K(()=>ar(t.value,Y));function i(f){const v=n.value.getBoundingClientRect();return[(f.clientX-v.left)/v.width,1-(f.clientY-v.top)/v.height]}function h(f){const[v,u]=i(f);let y=-1,g=1/0;t.value.forEach(([w,b],_)=>{const C=Math.hypot(w-v,b-u);C<g&&(g=C,y=_)}),!(y<0||g>.12)&&(a.value=y,n.value.setPointerCapture(f.pointerId),t.value=Ye(t.value,y,v,u))}function p(f){if(a.value===null)return;const[v,u]=i(f);t.value=Ye(t.value,a.value,v,u)}function m(f,v){const u=f.shiftKey?.05:.01,g={ArrowUp:[0,u],ArrowDown:[0,-u],ArrowLeft:[-u,0],ArrowRight:[u,0]}[f.key];if(!g)return;f.preventDefault();const[w,b]=t.value[v];t.value=Ye(t.value,v,w+g[0],b+g[1])}return(f,v)=>(k(),R("svg",{ref_key:"svg",ref:n,viewBox:`-6 -6 ${Y+12} ${Y+12}`,class:oe(["block aspect-square w-full max-w-72 touch-none select-none rounded-lg border border-line bg-surface-2/60",e.colorClass]),role:"group","aria-label":e.label,onPointerdown:h,onPointermove:p,onPointerup:v[0]||(v[0]=u=>a.value=null),onPointercancel:v[1]||(v[1]=u=>a.value=null),onDblclick:v[2]||(v[2]=u=>r("reset"))},[x("g",fr,[(k(),R(X,null,ne(3,u=>x("line",{key:`v${u}`,x1:u*Y/4,y1:"0",x2:u*Y/4,y2:Y},null,8,vr)),64)),(k(),R(X,null,ne(3,u=>x("line",{key:`h${u}`,x1:"0",y1:u*Y/4,x2:Y,y2:u*Y/4},null,8,hr)),64)),x("line",{x1:"0",y1:Y,x2:Y,y2:"0","stroke-dasharray":"4 4"})]),x("path",{d:s.value,fill:"none",stroke:"currentColor","stroke-width":"2.5"},null,8,mr),(k(!0),R(X,null,ne(t.value,(u,y)=>(k(),R("circle",{key:y,cx:u[0]*Y,cy:(1-u[1])*Y,r:a.value===y?7:5.5,tabindex:"0",class:"cursor-grab fill-surface outline-none focus-visible:stroke-accent",stroke:"currentColor","stroke-width":"2.5","aria-label":`${e.label} ${y+1}: ${Math.round(u[0]*255)} → ${Math.round(u[1]*255)}`,onKeydown:g=>m(g,y)},null,40,pr))),128))],42,dr))}}),gr=["onPointerdown"],wr=Le({__name:"PhotoCropOverlay",props:Ie({ratio:{}},{modelValue:{required:!0},modelModifiers:{}}),emits:["update:modelValue"],setup(e){const o=Ze(e,"modelValue"),t=e,r=$(null);let n=null;const a=K(()=>t.ratio===null?["nw","n","ne","e","se","s","sw","w"]:["nw","ne","se","sw"]),s={nw:"left-0 top-0 cursor-nwse-resize",n:"left-1/2 top-0 cursor-ns-resize",ne:"left-full top-0 cursor-nesw-resize",e:"left-full top-1/2 cursor-ew-resize",se:"left-full top-full cursor-nwse-resize",s:"left-1/2 top-full cursor-ns-resize",sw:"left-0 top-full cursor-nesw-resize",w:"left-0 top-1/2 cursor-ew-resize"};function i(m,f){m.preventDefault(),m.stopPropagation(),n={handle:f,x:m.clientX,y:m.clientY,start:{...o.value}},r.value?.setPointerCapture(m.pointerId)}function h(m){if(!n||!r.value)return;const f=r.value.getBoundingClientRect(),v=(m.clientX-n.x)/f.width,u=(m.clientY-n.y)/f.height;o.value=n.handle==="move"?Zo(n.start,v,u):Jo(n.start,n.handle,v,u,t.ratio)}const p=m=>`${m*100}%`;return(m,f)=>(k(),R("div",{ref_key:"root",ref:r,class:"absolute inset-0 touch-none select-none overflow-hidden",onPointermove:h,onPointerup:f[1]||(f[1]=v=>xe(n)?n.value=null:n=null),onPointercancel:f[2]||(f[2]=v=>xe(n)?n.value=null:n=null)},[x("div",{class:"absolute cursor-move shadow-[0_0_0_9999px_rgb(0_0_0/0.5)] outline outline-1 outline-white/90",style:ye({left:p(o.value.x),top:p(o.value.y),width:p(o.value.w),height:p(o.value.h)}),onPointerdown:f[0]||(f[0]=v=>i(v,"move"))},[f[4]||(f[4]=Yt('<div class="pointer-events-none absolute inset-0"><div class="absolute inset-y-0 left-1/3 w-px bg-white/40"></div><div class="absolute inset-y-0 left-2/3 w-px bg-white/40"></div><div class="absolute inset-x-0 top-1/3 h-px bg-white/40"></div><div class="absolute inset-x-0 top-2/3 h-px bg-white/40"></div></div>',1)),(k(!0),R(X,null,ne(a.value,v=>(k(),R("span",{key:v,class:oe(["absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center",s[v]]),onPointerdown:u=>i(u,v)},[...f[3]||(f[3]=[x("span",{class:"block h-3 w-3 rounded-sm border border-black/30 bg-white"},null,-1)])],42,gr))),128))],36)],544))}}),St=[{id:"aden",type:"1",map1:()=>J(()=>import("./aden-z-b2kCeH.js"),[],import.meta.url)},{id:"crema",type:"1",map1:()=>J(()=>import("./crema-B7LCGsii.js"),[],import.meta.url)},{id:"clarendon",type:"2",map1:()=>J(()=>import("./clarendon1-UtcH-ItH.js"),[],import.meta.url),map2:()=>J(()=>import("./clarendon2-gqIK7yZD.js"),[],import.meta.url)},{id:"gingham",type:"3",map1:()=>J(()=>import("./gingham1-XYBL9yCV.js"),[],import.meta.url),map2:()=>J(()=>import("./gingham_lgg-DKTq37Dx.js"),[],import.meta.url)},{id:"juno",type:"1",map1:()=>J(()=>import("./juno-CObA7Usi.js"),[],import.meta.url)},{id:"lark",type:"1",map1:()=>J(()=>import("./lark-DGUmaMaW.js"),[],import.meta.url)},{id:"ludwig",type:"1",map1:()=>J(()=>import("./ludwig-BRGqyOez.js"),[],import.meta.url)},{id:"moon",type:"4",map1:()=>J(()=>import("./moon1-GzydTKI3.js"),[],import.meta.url),map2:()=>J(()=>import("./moon2-eVwlvPIO.js"),[],import.meta.url)},{id:"reyes",type:"1",map1:()=>J(()=>import("./reyes-CXI1uauM.js"),[],import.meta.url)},{id:"polaroid",type:"MTX",mtx:"polaroid"},{id:"kodak",type:"MTX",mtx:"kodachrome"},{id:"browni",type:"MTX",mtx:"browni"},{id:"vintage",type:"MTX",mtx:"vintage"}];async function wt(e){const o=new Image;return o.src=(await e()).default,await o.decode(),o}const We=new Map;function br(e){let o=We.get(e);if(!o){const t=St.find(r=>r.id===e);if(!t)return Promise.reject(new Error(`unknown filter ${e}`));o=(async()=>{const[r,n]=await Promise.all([t.map1&&wt(t.map1),t.map2&&wt(t.map2)]);return{type:t.type,mtx:t.mtx,map1:r,map2:n}})(),o.catch(()=>We.delete(e)),We.set(e,o)}return o}const _r={class:"space-y-4"},yr={class:"text-xs text-fg-muted"},Cr={class:"flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface px-3 py-2"},kr={class:"mr-auto min-w-0"},Sr={class:"truncate text-sm font-medium text-fg"},Rr={class:"font-mono text-[11px] text-fg-muted"},Tr=["title"],Er=["aria-label"],$r={class:"w-7 text-right font-mono tabular-nums"},Mr={class:"grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"},Ar={class:"rounded-card border border-line bg-[linear-gradient(45deg,var(--c-surface-2)_25%,transparent_25%,transparent_75%,var(--c-surface-2)_75%),linear-gradient(45deg,var(--c-surface-2)_25%,transparent_25%,transparent_75%,var(--c-surface-2)_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] p-3 lg:sticky lg:top-4"},Br=["src"],zr={class:"pointer-events-none absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white"},Ir={class:"pointer-events-none absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white"},Dr=["aria-label","aria-valuenow"],Lr={class:"space-y-3"},Pr={key:0,class:"rounded-card border border-line bg-surface p-2"},Fr=["viewBox","aria-label"],Gr=["d"],Vr=["d"],Ur=["d"],Or={class:"grid grid-cols-5 gap-1 rounded-card border border-line bg-surface p-1",role:"tablist"},jr=["aria-selected","onClick"],Nr={class:"max-w-full truncate"},Xr={class:"rounded-card border border-line bg-surface p-4",role:"tabpanel"},Hr={key:0,class:"space-y-4"},Yr={class:"flex items-center gap-1"},Kr={class:"space-y-1.5"},Wr={class:"text-xs font-medium text-fg"},qr={class:"flex flex-wrap gap-1.5"},Zr=["aria-pressed","onClick"],Jr={class:"space-y-1.5"},Qr={class:"flex items-baseline justify-between text-xs"},en={class:"font-medium text-fg"},tn={class:"font-mono text-fg-muted"},on={class:"flex items-center gap-2 text-xs text-fg-muted"},rn=["value","aria-label"],nn=["value","aria-label"],an={class:"flex items-center justify-between gap-2 border-t border-line pt-3"},ln={class:"text-xs text-fg-muted"},sn={class:"font-mono text-fg"},un={class:"text-xs text-fg-faint"},cn={key:1,class:"space-y-4"},dn={class:"flex items-center justify-between"},fn={class:"text-xs font-semibold uppercase tracking-wider text-fg-muted"},vn={class:"text-xs text-fg-faint"},hn={key:2,class:"space-y-3"},mn={class:"flex items-center gap-1.5"},pn=["aria-pressed","onClick"],xn={class:"text-xs text-fg-faint"},gn={key:3,class:"space-y-3"},wn={class:"grid grid-cols-3 gap-1.5"},bn=["aria-pressed"],_n=["aria-pressed","onClick"],yn={key:0,class:"text-xs text-fg-muted"},Cn={key:4,class:"space-y-3"},kn={class:"flex items-center justify-between"},Sn={class:"text-xs font-semibold uppercase tracking-wider text-fg-muted"},Rn={class:"text-xs text-fg-faint"},Tn={class:"text-xs text-fg-faint"},Ae=256,Be=64,bt="h-8 w-20 rounded-md border border-line border-b-line-strong bg-control px-2 text-center font-mono text-xs text-fg focus-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",Un=Le({__name:"PhotoEditorTool",setup(e){const{t:o}=Jt(),t=(c,l)=>o(`tools.photo-editor.${c}`,l),{show:r}=Qt(),n=$(!1),a=$(0),s=$(""),i=$(0),h=$({width:0,height:0}),p=$({width:0,height:0}),m=$(null),f=$(""),v=$("");let u=null;const y=[{id:"composition",icon:mo},{id:"adjust",icon:so},{id:"curves",icon:bo},{id:"filters",icon:uo},{id:"blur",icon:fo}],g=$("adjust"),w=K(()=>n.value&&g.value==="composition"),b=$(0),_=$(0),C=$(!1),z=$(!1),V=$("free"),H=$({...ze}),P=Ne(ht()),ce=()=>({rgb:_e(),red:_e(),green:_e(),blue:_e()}),W=Ne(ce()),T=$("rgb"),M=$(null),G=$(1);let I=null;const te={bokeh:0,gaussian:0,lens:.5,centerX:.5,centerY:.5},B=Ne({...te}),O=$(!1),q=$(.5),ve=$(!0),Pe=$(null),he=$("jpeg"),Ce=$(90),ke=$(!1);function Fe(){const c=u?.gl.canvas;c&&(p.value={width:c.width,height:c.height})}function Je(){return b.value===0&&_.value===0&&!C.value&&!z.value&&qo(H.value)}function ge(c=!1){const l=u;if(!l)return;if(l.loadImage(),w.value||c){const D=l.gl.canvas;l.filterMatrix({translateX:0,translateY:0,angle:_.value+b.value,scale:Ho(D.width,D.height,_.value),fliph:C.value?1:0,flipv:z.value?1:0}),c&&(l.crop(xt(H.value,D.width,D.height)),l.loadImage())}l.filterAdjustments({...P}),P.bloom&&l.filterBloom(P.bloom),P.noise&&l.filterNoise(P.noise),(P.shadows||P.highlights)&&l.filterHighlightsShadows(P.highlights,-P.shadows);const d=nr(W);d&&l.filterCurves(d),I&&l.filterInsta(I,G.value-1);const A={centerX:B.centerX,centerY:B.centerY};B.bokeh&&l.filterBlurBokeh({bokehstrength:B.bokeh,bokehlensout:B.lens,...A}),B.gaussian&&l.filterBlurGaussian({gaussianstrength:B.gaussian,gaussianlensout:B.lens,...A}),l.paintCanvas(),Fe(),Rt()}let ie=0;function we(){ie||(ie=requestAnimationFrame(()=>{ie=0,ge()}))}const ae=document.createElement("canvas");function Rt(){const c=u?.gl.canvas;if(!ve.value||!(c instanceof HTMLCanvasElement))return;const l=Math.min(1,240/Math.max(c.width,c.height));ae.width=Math.max(1,Math.round(c.width*l)),ae.height=Math.max(1,Math.round(c.height*l));const d=ae.getContext("2d",{willReadFrequently:!0});d&&(d.clearRect(0,0,ae.width,ae.height),d.drawImage(c,0,0,ae.width,ae.height),Pe.value=lr(d.getImageData(0,0,ae.width,ae.height).data))}const Se=K(()=>{const c=Pe.value;if(!c)return null;const l=ir(c);return{r:Ke(c.r,Ae,Be,l),g:Ke(c.g,Ae,Be,l),b:Ke(c.b,Ae,Be,l)}});function Ge(){if(!u)return;const c=u.gl;u.destroy(),c.getExtension("WEBGL_lose_context")?.loseContext(),u=null}function Qe(){g.value="adjust",b.value=0,_.value=0,C.value=!1,z.value=!1,V.value="free",H.value={...ze},Object.assign(P,ht()),Object.assign(W,ce()),T.value="rgb",M.value=null,G.value=1,Object.assign(B,te),O.value=!1,q.value=.5}async function et(c){if(!c.type.startsWith("image/")&&c.type!=="")return r(t("loadFailed"),"error");const l=URL.createObjectURL(c),d=new Image;d.src=l;try{await d.decode()}catch{return URL.revokeObjectURL(l),r(t("loadFailed"),"error")}ie&&cancelAnimationFrame(ie),ie=0,Ge(),f.value&&URL.revokeObjectURL(f.value),Qe(),await $e(),f.value=v.value=l,s.value=c.name,i.value=c.size,h.value={width:d.naturalWidth,height:d.naturalHeight},Pe.value=null,a.value++,n.value=!0,await $e();try{u=m.value?Lo(m.value,d,"srgb")??null:null}catch{u=null}if(!u)return n.value=!1,r(t("webglUnsupported"),"error",4e3);const A=Number(u.gl.getParameter(u.gl.MAX_TEXTURE_SIZE));if(Math.max(d.naturalWidth,d.naturalHeight)>A)return Ge(),n.value=!1,r(t("tooLarge",{max:A}),"error",4e3);ge()}async function Tt(c){c[0]&&await et(c[0])}async function Et(){const[c]=await no("image/*");c&&await et(c)}function Re(){const c=u;if(!c)return;const{width:l,height:d}=mt(c.width,c.height,b.value),A=c.gl.canvas;(A.width!==l||A.height!==d)&&(A.width=l,A.height=d,c.setupFiltersTextures()),Fe()}be(w,c=>{const l=u;l&&(c?(O.value=!1,l.resetCrop(),Re(),ge()):(ge(!Je()),v.value=l.img_cropped?.src??f.value))});const Ve=K(()=>{const{width:c,height:l}=p.value,d=c&&l?Ko(V.value,c,l):null;return d===null?null:Wo(d,c,l)});be(V,()=>{H.value=pt(Ve.value)});function tt(c){b.value=Xo(b.value,c),Re(),H.value=pt(Ve.value)}const Te=K(()=>mt(h.value.width,h.value.height,b.value)),$t=K(()=>Te.value.width?Math.round(p.value.width/Te.value.width*1e3)/10:100),ot=K(()=>xt(H.value,p.value.width,p.value.height));function rt(c,l){const d=u,A=Number(l.target.value);if(!d||!Number.isFinite(A)||A<=0)return Fe();const D=Te.value,Z=Qo(c,A,D.width/D.height);Z.width===D.width?d.resetResize():b.value%180?d.resize(Z.height,Z.width):d.resize(Z.width,Z.height),Re(),we()}function nt(){b.value=0,_.value=0,C.value=!1,z.value=!1,V.value="free",u?.resetResize(),Re(),H.value={...ze}}const Mt=K(()=>!Je()||V.value!=="free"||p.value.width!==Te.value.width),Ue=$(!1);be(M,async c=>{if(!c)return I=null,we();Ue.value=!0;try{const l=await br(c);M.value===c&&(I=l,we())}catch{r(t("loadFailed"),"error"),M.value=null}finally{Ue.value=!1}}),be([P,W,B,G,_,C,z,b,ve],we,{deep:!0});const at=$(null),lt=$({width:0,height:0}),Oe=new ResizeObserver(([c])=>{c&&(lt.value={width:c.contentRect.width,height:c.contentRect.height})});be(at,(c,l)=>{l&&Oe.unobserve(l),c&&Oe.observe(c)});const At=K(()=>{const{width:c,height:l}=lt.value,{width:d,height:A}=p.value;if(!c||!l||!d||!A)return{width:"0px",height:"0px"};const D=Math.min(c/d,l/A);return{width:`${Math.floor(d*D)}px`,height:`${Math.floor(A*D)}px`}}),je=$(null);function it(c){const l=je.value.getBoundingClientRect();return{x:F((c.clientX-l.left)/l.width,0,1),y:F((c.clientY-l.top)/l.height,0,1)}}let se=!1;function Bt(c){g.value!=="blur"||O.value||(se=!0,je.value?.setPointerCapture(c.pointerId),st(c))}function st(c){if(!se)return;const l=it(c);B.centerX=l.x,B.centerY=l.y}let ue=!1;function zt(c){c.stopPropagation(),ue=!0,c.currentTarget.setPointerCapture(c.pointerId)}function It(c){ue&&(q.value=it(c).x)}function Dt(c){const l=c.key==="ArrowLeft"?-.02:c.key==="ArrowRight"?.02:0;l&&(c.preventDefault(),q.value=F(q.value+l,0,1))}function Lt(){w.value&&(g.value="adjust"),O.value=!O.value}function Pt(c){for(const l of De[c])P[l]=0}const Ft=K(()=>qe.some(c=>!Ct(W[c])));function Gt(){Object.assign(W,ce())}const Vt=K(()=>Object.keys(te).some(c=>B[c]!==te[c]));function Ut(){Object.assign(B,te)}async function Ot(){Qe(),await $e(),u?.resetCrop(),nt(),v.value=f.value,we()}async function jt(){const c=u;if(!(!c||ke.value)){ke.value=!0;try{w.value&&(g.value="adjust",await $e()),ge();const{width:l,height:d}=c.gl.canvas,A=new ImageData(new Uint8ClampedArray(c.readPixels().buffer),l,d),D=document.createElement("canvas");D.width=l,D.height=d;const Z=D.getContext("2d");if(he.value==="jpeg"){const me=document.createElement("canvas");me.width=l,me.height=d,me.getContext("2d").putImageData(A,0,0),Z.fillStyle="#fff",Z.fillRect(0,0,l,d),Z.drawImage(me,0,0)}else Z.putImageData(A,0,0);const ut=await new Promise(me=>D.toBlob(me,`image/${he.value}`,Ce.value/100));if(!ut)throw new Error("toBlob failed");ao(ut,cr(s.value,he.value))}catch{r(t("exportFailed"),"error")}finally{ke.value=!1}}}Kt(()=>{ie&&cancelAnimationFrame(ie),Oe.disconnect(),Ge(),f.value&&URL.revokeObjectURL(f.value)});const Ee=c=>["inline-flex h-7 items-center justify-center gap-1 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-ring",c?"border-accent/40 bg-accent-soft text-accent":"border-line text-fg-muted hover:text-fg hover:bg-surface-3"],Nt={rgb:"text-fg",red:"text-danger",green:"text-success",blue:"text-accent"},Xt=K(()=>sr.map(c=>({value:c,label:c==="jpeg"?"JPEG":c.toUpperCase()}))),Ht=c=>c[0].toUpperCase()+c.slice(1);return(c,l)=>(k(),R("div",_r,[n.value?(k(),R(X,{key:1},[x("div",Cr,[x("div",kr,[x("div",Sr,E(s.value),1),x("div",Rr,[re(E(h.value.width)+" × "+E(h.value.height)+" · "+E(L(oo)(i.value))+" ",1),p.value.width!==h.value.width||p.value.height!==h.value.height?(k(),R(X,{key:0},[re(" → "+E(p.value.width)+" × "+E(p.value.height),1)],64)):de("",!0)])]),S(Q,{title:t("open"),onClick:Et},{default:j(()=>[S(L(lo),{class:"h-4 w-4"})]),_:1},8,["title"]),S(Q,{title:t("splitView"),active:O.value,onClick:Lt},{default:j(()=>[S(L(ho),{class:"h-4 w-4"})]),_:1},8,["title","active"]),S(Q,{title:t("histogram"),active:ve.value,onClick:l[0]||(l[0]=d=>ve.value=!ve.value)},{default:j(()=>[S(L(vo),{class:"h-4 w-4"})]),_:1},8,["title","active"]),S(Q,{title:t("resetAll"),onClick:Ot},{default:j(()=>[S(L(io),{class:"h-4 w-4"})]),_:1},8,["title"]),l[26]||(l[26]=x("span",{class:"mx-1 hidden h-6 w-px bg-line sm:block"},null,-1)),S(to,{modelValue:he.value,"onUpdate:modelValue":l[1]||(l[1]=d=>he.value=d),options:Xt.value,size:"sm","aria-label":t("format")},null,8,["modelValue","options","aria-label"]),he.value!=="png"?(k(),R("label",{key:0,class:"flex items-center gap-1.5 text-xs text-fg-muted",title:t("quality")},[Wt(x("input",{"onUpdate:modelValue":l[2]||(l[2]=d=>Ce.value=d),type:"range",min:"10",max:"100",step:"5",class:"w-20 cursor-pointer accent-accent","aria-label":t("quality")},null,8,Er),[[qt,Ce.value,void 0,{number:!0}]]),x("span",$r,E(Ce.value),1)],8,Tr)):de("",!0),S(ct,{variant:"primary",size:"sm",disabled:ke.value,onClick:jt},{default:j(()=>[S(L(ro),{class:"h-4 w-4"}),re(E(L(o)("common.download")),1)]),_:1},8,["disabled"])]),x("div",Mr,[x("div",Ar,[x("div",{ref_key:"viewport",ref:at,class:"flex h-[55vh] min-h-72 items-center justify-center overflow-hidden lg:h-[calc(100vh-13rem)]"},[x("div",{ref_key:"stage",ref:je,class:oe(["relative shrink-0",g.value==="blur"&&!O.value?"cursor-crosshair touch-none":""]),style:ye(At.value),onPointerdown:Bt,onPointermove:st,onPointerup:l[6]||(l[6]=d=>xe(se)?se.value=!1:se=!1),onPointercancel:l[7]||(l[7]=d=>xe(se)?se.value=!1:se=!1)},[(k(),R("canvas",{key:a.value,ref_key:"canvas",ref:m,class:"block h-full w-full"})),O.value&&!w.value?(k(),R(X,{key:0},[x("img",{src:v.value,alt:"",draggable:"false",class:"pointer-events-none absolute inset-0 h-full w-full select-none",style:ye({clipPath:`inset(0 ${(1-q.value)*100}% 0 0)`})},null,12,Br),x("span",zr,E(t("before")),1),x("span",Ir,E(t("after")),1),x("div",{class:"absolute inset-y-0 flex w-6 -translate-x-1/2 cursor-ew-resize touch-none justify-center focus-ring",style:ye({left:`${q.value*100}%`}),role:"slider",tabindex:"0","aria-label":t("splitView"),"aria-valuenow":Math.round(q.value*100),"aria-valuemin":"0","aria-valuemax":"100",onPointerdown:zt,onPointermove:It,onPointerup:l[3]||(l[3]=d=>xe(ue)?ue.value=!1:ue=!1),onPointercancel:l[4]||(l[4]=d=>xe(ue)?ue.value=!1:ue=!1),onKeydown:Dt},[...l[27]||(l[27]=[x("span",{class:"h-full w-0.5 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.3)]"},null,-1),x("span",{class:"absolute top-1/2 h-8 w-4 -translate-y-1/2 rounded-full border border-black/30 bg-white"},null,-1)])],44,Dr)],64)):de("",!0),w.value?(k(),Xe(wr,{key:1,modelValue:H.value,"onUpdate:modelValue":l[5]||(l[5]=d=>H.value=d),ratio:Ve.value},null,8,["modelValue","ratio"])):de("",!0),g.value==="blur"&&!O.value?(k(),R("span",{key:2,class:"pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]",style:ye({left:`${B.centerX*100}%`,top:`${B.centerY*100}%`})},null,4)):de("",!0)],38)],512)]),x("div",Lr,[ve.value&&Se.value?(k(),R("div",Pr,[(k(),R("svg",{viewBox:`0 0 ${Ae} ${Be}`,preserveAspectRatio:"none",class:"block h-16 w-full",role:"img","aria-label":t("histogram")},[x("path",{d:Se.value.r,class:"fill-danger","fill-opacity":"0.45"},null,8,Gr),x("path",{d:Se.value.g,class:"fill-success","fill-opacity":"0.45"},null,8,Vr),x("path",{d:Se.value.b,class:"fill-accent","fill-opacity":"0.45"},null,8,Ur)],8,Fr))])):de("",!0),x("div",Or,[(k(),R(X,null,ne(y,d=>x("button",{key:d.id,type:"button",role:"tab","aria-selected":g.value===d.id,class:oe(["flex flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors focus-ring",g.value===d.id?"bg-accent-soft text-accent":"text-fg-muted hover:bg-surface-3 hover:text-fg"]),onClick:A=>g.value=d.id},[(k(),Xe(Zt(d.icon),{class:"h-4 w-4"})),x("span",Nr,E(t(d.id)),1)],10,jr)),64))]),x("div",Xr,[g.value==="composition"?(k(),R("div",Hr,[x("div",Yr,[S(Q,{title:t("rotateLeft"),onClick:l[8]||(l[8]=d=>tt(-90))},{default:j(()=>[S(L(go),{class:"h-4 w-4"})]),_:1},8,["title"]),S(Q,{title:t("rotateRight"),onClick:l[9]||(l[9]=d=>tt(90))},{default:j(()=>[S(L(wo),{class:"h-4 w-4"})]),_:1},8,["title"]),S(Q,{title:t("flipH"),active:C.value,onClick:l[10]||(l[10]=d=>C.value=!C.value)},{default:j(()=>[S(L(po),{class:"h-4 w-4"})]),_:1},8,["title","active"]),S(Q,{title:t("flipV"),active:z.value,onClick:l[11]||(l[11]=d=>z.value=!z.value)},{default:j(()=>[S(L(xo),{class:"h-4 w-4"})]),_:1},8,["title","active"]),l[28]||(l[28]=x("span",{class:"flex-1"},null,-1)),S(Q,{title:t("reset"),disabled:!Mt.value,onClick:nt},{default:j(()=>[S(L(Me),{class:"h-4 w-4"})]),_:1},8,["title","disabled"])]),S(pe,{modelValue:_.value,"onUpdate:modelValue":l[12]||(l[12]=d=>_.value=d),label:t("straighten"),min:-45,max:45,step:.25},null,8,["modelValue","label"]),x("div",Kr,[x("div",Wr,E(t("aspect")),1),x("div",qr,[(k(!0),R(X,null,ne(L(Yo),d=>(k(),R("button",{key:d,type:"button",class:oe(Ee(V.value===d)),"aria-pressed":V.value===d,onClick:A=>V.value=d},E(d==="free"?t("aspectFree"):d==="original"?t("aspectOriginal"):d),11,Zr))),128))])]),x("div",Jr,[x("div",Qr,[x("span",en,E(t("size")),1),x("span",tn,E($t.value)+"%",1)]),x("div",on,[x("input",{type:"number",min:"16",value:p.value.width,class:oe(bt),"aria-label":t("width"),onChange:l[13]||(l[13]=d=>rt("width",d))},null,40,rn),l[29]||(l[29]=re(" × ",-1)),x("input",{type:"number",min:"16",value:p.value.height,class:oe(bt),"aria-label":t("height"),onChange:l[14]||(l[14]=d=>rt("height",d))},null,40,nn),l[30]||(l[30]=re(" px ",-1))])]),x("div",an,[x("span",ln,[re(E(t("output"))+" ",1),x("span",sn,E(ot.value.width)+" × "+E(ot.value.height),1)]),S(ct,{variant:"primary",size:"sm",onClick:l[15]||(l[15]=d=>g.value="adjust")},{default:j(()=>[S(L(co),{class:"h-4 w-4"}),re(E(t("apply")),1)]),_:1})]),x("p",un,E(t("compositionHint")),1)])):g.value==="adjust"?(k(),R("div",cn,[(k(!0),R(X,null,ne(L(De),(d,A)=>(k(),R("section",{key:A,class:"space-y-1"},[x("div",dn,[x("h3",fn,E(t(A)),1),S(Q,{size:"sm",title:t("reset"),disabled:L(No)(P,A),onClick:D=>Pt(A)},{default:j(()=>[S(L(Me),{class:"h-3.5 w-3.5"})]),_:1},8,["title","disabled","onClick"])]),(k(!0),R(X,null,ne(d,D=>(k(),Xe(pe,{key:D,modelValue:P[D],"onUpdate:modelValue":Z=>P[D]=Z,label:t(D)},null,8,["modelValue","onUpdate:modelValue","label"]))),128))]))),128)),x("p",vn,E(t("sliderHint")),1)])):g.value==="curves"?(k(),R("div",hn,[x("div",mn,[(k(!0),R(X,null,ne(L(qe),d=>(k(),R("button",{key:d,type:"button",class:oe(Ee(T.value===d)),"aria-pressed":T.value===d,onClick:A=>T.value=d},E(t(`channel_${d}`)),11,pn))),128)),l[31]||(l[31]=x("span",{class:"flex-1"},null,-1)),S(Q,{size:"sm",title:t("reset"),disabled:!Ft.value,onClick:Gt},{default:j(()=>[S(L(Me),{class:"h-3.5 w-3.5"})]),_:1},8,["title","disabled"])]),S(xr,{modelValue:W[T.value],"onUpdate:modelValue":l[16]||(l[16]=d=>W[T.value]=d),label:t(`channel_${T.value}`),"color-class":Nt[T.value],class:"mx-auto",onReset:l[17]||(l[17]=d=>W[T.value]=L(_e)())},null,8,["modelValue","label","color-class"]),x("p",xn,E(t("curvesHint")),1)])):g.value==="filters"?(k(),R("div",gn,[x("div",wn,[x("button",{type:"button",class:oe(Ee(M.value===null)),"aria-pressed":M.value===null,onClick:l[18]||(l[18]=d=>M.value=null)},E(t("none")),11,bn),(k(!0),R(X,null,ne(L(St),d=>(k(),R("button",{key:d.id,type:"button",class:oe(Ee(M.value===d.id)),"aria-pressed":M.value===d.id,onClick:A=>M.value=d.id},E(Ht(d.id)),11,_n))),128))]),S(pe,{modelValue:G.value,"onUpdate:modelValue":l[19]||(l[19]=d=>G.value=d),label:t("strength"),min:0,max:1,reset:1},null,8,["modelValue","label"]),Ue.value?(k(),R("p",yn,E(t("loading")),1)):de("",!0)])):(k(),R("div",Cn,[x("div",kn,[x("h3",Sn,E(t("blur")),1),S(Q,{size:"sm",title:t("reset"),disabled:!Vt.value,onClick:Ut},{default:j(()=>[S(L(Me),{class:"h-3.5 w-3.5"})]),_:1},8,["title","disabled"])]),S(pe,{modelValue:B.bokeh,"onUpdate:modelValue":l[20]||(l[20]=d=>B.bokeh=d),label:t("bokeh"),min:0,max:1},null,8,["modelValue","label"]),S(pe,{modelValue:B.gaussian,"onUpdate:modelValue":l[21]||(l[21]=d=>B.gaussian=d),label:t("gaussian"),min:0,max:1},null,8,["modelValue","label"]),S(pe,{modelValue:B.lens,"onUpdate:modelValue":l[22]||(l[22]=d=>B.lens=d),label:t("focusSize"),min:0,max:1,reset:.5},null,8,["modelValue","label"]),x("p",Rn,E(t("blurHint")),1)]))]),x("p",Tn,[re(E(t("credit"))+" ",1),l[32]||(l[32]=x("a",{href:"https://github.com/xdadda/mini-photo-editor",target:"_blank",rel:"noopener noreferrer",class:"text-accent hover:underline"},"mini-photo-editor",-1))])])])],64)):(k(),R(X,{key:0},[S(eo,{accept:"image/*",label:t("drop"),onFiles:Tt},null,8,["label"]),x("p",yr,[re(E(t("credit"))+" ",1),l[23]||(l[23]=x("a",{href:"https://github.com/xdadda/mini-photo-editor",target:"_blank",rel:"noopener noreferrer",class:"text-accent hover:underline"},"mini-photo-editor",-1)),l[24]||(l[24]=re(" · ",-1)),l[25]||(l[25]=x("a",{href:"https://github.com/xdadda/mini-gl",target:"_blank",rel:"noopener noreferrer",class:"text-accent hover:underline"},"mini-gl",-1))])],64))]))}});export{Un as default};
