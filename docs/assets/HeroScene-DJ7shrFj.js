import{r as a,u as Y,j as m}from"./index-CViW2AkO.js";import{R as de,V as x,B as Ae,I as Me,F as ie,b as X,c as I,W as Le,d as Z,S as pe,e as me,U as se,f as oe,g as K,h as ze,i as j,L as Be,j as Ue,M as H,k as he,l as Q,E as Pe,m as Ce,u as W,n as je,C as Re,A as Oe,o as Ie,p as De,q as Te,r as He}from"./react-three-fiber.esm-Bq6DYhse.js";function P(){return P=Object.assign?Object.assign.bind():function(s){for(var e=1;e<arguments.length;e++){var t=arguments[e];for(var i in t)({}).hasOwnProperty.call(t,i)&&(s[i]=t[i])}return s},P.apply(null,arguments)}const ve=parseInt(de.replace(/\D+/g,"")),ge=ve>=125?"uv1":"uv2";function Ge(s,e=Math.PI/3){const t=Math.cos(e),i=(1+1e-10)*100,n=[new x,new x,new x],o=new x,c=new x,r=new x,l=new x;function f(v){const w=~~(v.x*i),g=~~(v.y*i),M=~~(v.z*i);return`${w},${g},${M}`}const d=s.index?s.toNonIndexed():s,u=d.attributes.position,h={};for(let v=0,w=u.count/3;v<w;v++){const g=3*v,M=n[0].fromBufferAttribute(u,g+0),p=n[1].fromBufferAttribute(u,g+1),S=n[2].fromBufferAttribute(u,g+2);o.subVectors(S,p),c.subVectors(M,p);const R=new x().crossVectors(o,c).normalize();for(let D=0;D<3;D++){const F=n[D],O=f(F);O in h||(h[O]=[]),h[O].push(R)}}const b=new Float32Array(u.count*3),y=new Ae(b,3,!1);for(let v=0,w=u.count/3;v<w;v++){const g=3*v,M=n[0].fromBufferAttribute(u,g+0),p=n[1].fromBufferAttribute(u,g+1),S=n[2].fromBufferAttribute(u,g+2);o.subVectors(S,p),c.subVectors(M,p),r.crossVectors(o,c).normalize();for(let R=0;R<3;R++){const D=n[R],F=f(D),O=h[F];l.set(0,0,0);for(let $=0,_e=O.length;$<_e;$++){const ne=O[$];r.dot(ne)>t&&l.add(ne)}l.normalize(),y.setXYZ(g+R,l.x,l.y,l.z)}}return d.setAttribute("normal",y),d}const re=new Z,G=new x;class ee extends Me{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const e=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],t=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],i=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(i),this.setAttribute("position",new ie(e,3)),this.setAttribute("uv",new ie(t,2))}applyMatrix4(e){const t=this.attributes.instanceStart,i=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),i.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));const i=new X(t,6,1);return this.setAttribute("instanceStart",new I(i,3,0)),this.setAttribute("instanceEnd",new I(i,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let i;e instanceof Float32Array?i=e:Array.isArray(e)&&(i=new Float32Array(e));const n=new X(i,t*2,1);return this.setAttribute("instanceColorStart",new I(n,t,0)),this.setAttribute("instanceColorEnd",new I(n,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new Le(e.geometry)),this}fromLineSegments(e){const t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Z);const e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),re.setFromBufferAttribute(t),this.boundingBox.union(re))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new pe),this.boundingBox===null&&this.computeBoundingBox();const e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){const i=this.boundingSphere.center;this.boundingBox.getCenter(i);let n=0;for(let o=0,c=e.count;o<c;o++)G.fromBufferAttribute(e,o),n=Math.max(n,i.distanceToSquared(G)),G.fromBufferAttribute(t,o),n=Math.max(n,i.distanceToSquared(G));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}class ye extends ee{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){const t=e.length-3,i=new Float32Array(2*t);for(let n=0;n<t;n+=3)i[2*n]=e[n],i[2*n+1]=e[n+1],i[2*n+2]=e[n+2],i[2*n+3]=e[n+3],i[2*n+4]=e[n+4],i[2*n+5]=e[n+5];return super.setPositions(i),this}setColors(e,t=3){const i=e.length-t,n=new Float32Array(2*i);if(t===3)for(let o=0;o<i;o+=t)n[2*o]=e[o],n[2*o+1]=e[o+1],n[2*o+2]=e[o+2],n[2*o+3]=e[o+3],n[2*o+4]=e[o+4],n[2*o+5]=e[o+5];else for(let o=0;o<i;o+=t)n[2*o]=e[o],n[2*o+1]=e[o+1],n[2*o+2]=e[o+2],n[2*o+3]=e[o+3],n[2*o+4]=e[o+4],n[2*o+5]=e[o+5],n[2*o+6]=e[o+6],n[2*o+7]=e[o+7];return super.setColors(n,t),this}fromLine(e){const t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class te extends me{constructor(e){super({type:"LineMaterial",uniforms:se.clone(se.merge([oe.common,oe.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new K(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${ve>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(t){this.uniforms.diffuse.value=t}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(t){t===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(t){this.uniforms.linewidth.value=t}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(t){!!t!="USE_DASH"in this.defines&&(this.needsUpdate=!0),t===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(t){this.uniforms.dashScale.value=t}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(t){this.uniforms.dashSize.value=t}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(t){this.uniforms.dashOffset.value=t}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(t){this.uniforms.gapSize.value=t}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(t){this.uniforms.opacity.value=t}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(t){this.uniforms.resolution.value.copy(t)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(t){!!t!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),t===!0?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}const k=new j,ae=new x,ce=new x,E=new j,_=new j,L=new j,q=new x,J=new Ue,A=new Be,le=new x,N=new Z,V=new pe,z=new j;let U,C;function ue(s,e,t){return z.set(0,0,-e,1).applyMatrix4(s.projectionMatrix),z.multiplyScalar(1/z.w),z.x=C/t.width,z.y=C/t.height,z.applyMatrix4(s.projectionMatrixInverse),z.multiplyScalar(1/z.w),Math.abs(Math.max(z.x,z.y))}function Ne(s,e){const t=s.matrixWorld,i=s.geometry,n=i.attributes.instanceStart,o=i.attributes.instanceEnd,c=Math.min(i.instanceCount,n.count);for(let r=0,l=c;r<l;r++){A.start.fromBufferAttribute(n,r),A.end.fromBufferAttribute(o,r),A.applyMatrix4(t);const f=new x,d=new x;U.distanceSqToSegment(A.start,A.end,d,f),d.distanceTo(f)<C*.5&&e.push({point:d,pointOnLine:f,distance:U.origin.distanceTo(d),object:s,face:null,faceIndex:r,uv:null,[ge]:null})}}function Ve(s,e,t){const i=e.projectionMatrix,o=s.material.resolution,c=s.matrixWorld,r=s.geometry,l=r.attributes.instanceStart,f=r.attributes.instanceEnd,d=Math.min(r.instanceCount,l.count),u=-e.near;U.at(1,L),L.w=1,L.applyMatrix4(e.matrixWorldInverse),L.applyMatrix4(i),L.multiplyScalar(1/L.w),L.x*=o.x/2,L.y*=o.y/2,L.z=0,q.copy(L),J.multiplyMatrices(e.matrixWorldInverse,c);for(let h=0,b=d;h<b;h++){if(E.fromBufferAttribute(l,h),_.fromBufferAttribute(f,h),E.w=1,_.w=1,E.applyMatrix4(J),_.applyMatrix4(J),E.z>u&&_.z>u)continue;if(E.z>u){const p=E.z-_.z,S=(E.z-u)/p;E.lerp(_,S)}else if(_.z>u){const p=_.z-E.z,S=(_.z-u)/p;_.lerp(E,S)}E.applyMatrix4(i),_.applyMatrix4(i),E.multiplyScalar(1/E.w),_.multiplyScalar(1/_.w),E.x*=o.x/2,E.y*=o.y/2,_.x*=o.x/2,_.y*=o.y/2,A.start.copy(E),A.start.z=0,A.end.copy(_),A.end.z=0;const v=A.closestPointToPointParameter(q,!0);A.at(v,le);const w=H.lerp(E.z,_.z,v),g=w>=-1&&w<=1,M=q.distanceTo(le)<C*.5;if(g&&M){A.start.fromBufferAttribute(l,h),A.end.fromBufferAttribute(f,h),A.start.applyMatrix4(c),A.end.applyMatrix4(c);const p=new x,S=new x;U.distanceSqToSegment(A.start,A.end,S,p),t.push({point:S,pointOnLine:p,distance:U.origin.distanceTo(S),object:s,face:null,faceIndex:h,uv:null,[ge]:null})}}}class xe extends ze{constructor(e=new ee,t=new te({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const e=this.geometry,t=e.attributes.instanceStart,i=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let c=0,r=0,l=t.count;c<l;c++,r+=2)ae.fromBufferAttribute(t,c),ce.fromBufferAttribute(i,c),n[r]=r===0?0:n[r-1],n[r+1]=n[r]+ae.distanceTo(ce);const o=new X(n,2,1);return e.setAttribute("instanceDistanceStart",new I(o,1,0)),e.setAttribute("instanceDistanceEnd",new I(o,1,1)),this}raycast(e,t){const i=this.material.worldUnits,n=e.camera;n===null&&!i&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const o=e.params.Line2!==void 0&&e.params.Line2.threshold||0;U=e.ray;const c=this.matrixWorld,r=this.geometry,l=this.material;C=l.linewidth+o,r.boundingSphere===null&&r.computeBoundingSphere(),V.copy(r.boundingSphere).applyMatrix4(c);let f;if(i)f=C*.5;else{const u=Math.max(n.near,V.distanceToPoint(U.origin));f=ue(n,u,l.resolution)}if(V.radius+=f,U.intersectsSphere(V)===!1)return;r.boundingBox===null&&r.computeBoundingBox(),N.copy(r.boundingBox).applyMatrix4(c);let d;if(i)d=C*.5;else{const u=Math.max(n.near,N.distanceToPoint(U.origin));d=ue(n,u,l.resolution)}N.expandByScalar(d),U.intersectsBox(N)!==!1&&(i?Ne(this,t):Ve(this,n,t))}onBeforeRender(e){const t=this.material.uniforms;t&&t.resolution&&(e.getViewport(k),this.material.uniforms.resolution.value.set(k.z,k.w))}}class We extends xe{constructor(e=new ye,t=new te({color:Math.random()*16777215})){super(e,t),this.isLine2=!0,this.type="Line2"}}const Fe=a.forwardRef(function({points:e,color:t=16777215,vertexColors:i,linewidth:n,lineWidth:o,segments:c,dashed:r,...l},f){var d,u;const h=he(g=>g.size),b=a.useMemo(()=>c?new xe:new We,[c]),[y]=a.useState(()=>new te),v=(i==null||(d=i[0])==null?void 0:d.length)===4?4:3,w=a.useMemo(()=>{const g=c?new ee:new ye,M=e.map(p=>{const S=Array.isArray(p);return p instanceof x||p instanceof j?[p.x,p.y,p.z]:p instanceof K?[p.x,p.y,0]:S&&p.length===3?[p[0],p[1],p[2]]:S&&p.length===2?[p[0],p[1],0]:p});if(g.setPositions(M.flat()),i){t=16777215;const p=i.map(S=>S instanceof Q?S.toArray():S);g.setColors(p.flat(),v)}return g},[e,c,i,v]);return a.useLayoutEffect(()=>{b.computeLineDistances()},[e,b]),a.useLayoutEffect(()=>{r?y.defines.USE_DASH="":delete y.defines.USE_DASH,y.needsUpdate=!0},[r,y]),a.useEffect(()=>()=>{w.dispose(),y.dispose()},[w]),a.createElement("primitive",P({object:b,ref:f},l),a.createElement("primitive",{object:w,attach:"geometry"}),a.createElement("primitive",P({object:y,attach:"material",color:t,vertexColors:!!i,resolution:[h.width,h.height],linewidth:(u=n??o)!==null&&u!==void 0?u:1,dashed:r,transparent:v===4},l)))}),$e=()=>parseInt(de.replace(/\D+/g,"")),ke=$e(),qe=a.forwardRef(({threshold:s=15,geometry:e,...t},i)=>{const n=a.useRef(null);a.useImperativeHandle(i,()=>n.current,[]);const o=a.useMemo(()=>[0,0,0,1,0,0],[]),c=a.useRef(null),r=a.useRef(null);return a.useLayoutEffect(()=>{const l=n.current.parent,f=e??(l==null?void 0:l.geometry);if(!f||c.current===f&&r.current===s)return;c.current=f,r.current=s;const u=new Pe(f,s).attributes.position.array;n.current.geometry.setPositions(u),n.current.geometry.attributes.instanceStart.needsUpdate=!0,n.current.geometry.attributes.instanceEnd.needsUpdate=!0,n.current.computeLineDistances()}),a.createElement(Fe,P({segments:!0,points:o,ref:n,raycast:()=>null},t))}),B=1e-5;function Je(s,e,t){const i=new Ce,n=t-B;return i.absarc(B,B,B,-Math.PI/2,-Math.PI,!0),i.absarc(B,e-n*2,B,Math.PI,Math.PI/2,!0),i.absarc(s-n*2,e-n*2,B,Math.PI/2,0,!0),i.absarc(s-n*2,B,B,0,-Math.PI/2,!0),i}const Xe=a.forwardRef(function({args:[e=1,t=1,i=1]=[],radius:n=.05,steps:o=1,smoothness:c=4,bevelSegments:r=4,creaseAngle:l=.4,children:f,...d},u){return a.createElement("mesh",P({ref:u},d),a.createElement(Ye,{args:[e,t,i],radius:n,steps:o,smoothness:c,bevelSegments:r,creaseAngle:l}),f)}),Ye=a.forwardRef(function({args:[e=1,t=1,i=1]=[],radius:n=.05,steps:o=1,smoothness:c=4,bevelSegments:r=4,creaseAngle:l=.4,...f},d){const u=a.useMemo(()=>Je(e,t,n),[e,t,n]),h=a.useMemo(()=>({depth:i-n*2,bevelEnabled:!0,bevelSegments:r*2,steps:o,bevelSize:n-B,bevelThickness:n,curveSegments:c}),[i,n,c,r,o]),b=a.useRef(null);return a.useLayoutEffect(()=>{b.current&&(b.current.center(),Ge(b.current,l))},[u,h,l]),a.useImperativeHandle(d,()=>b.current),a.createElement("extrudeGeometry",P({ref:b,args:[u,h]},f))}),Ze=a.forwardRef(({children:s,enabled:e=!0,speed:t=1,rotationIntensity:i=1,floatIntensity:n=1,floatingRange:o=[-.1,.1],autoInvalidate:c=!1,...r},l)=>{const f=a.useRef(null);a.useImperativeHandle(l,()=>f.current,[]);const d=a.useRef(Math.random()*1e4);return W(u=>{var h,b;if(!e||t===0)return;c&&u.invalidate();const y=d.current+u.clock.elapsedTime;f.current.rotation.x=Math.cos(y/4*t)/8*i,f.current.rotation.y=Math.sin(y/4*t)/8*i,f.current.rotation.z=Math.sin(y/4*t)/20*i;let v=Math.sin(y/4*t)/10;v=H.mapLinear(v,-.1,.1,(h=o==null?void 0:o[0])!==null&&h!==void 0?h:-.1,(b=o==null?void 0:o[1])!==null&&b!==void 0?b:.1),f.current.position.y=v*n,f.current.updateMatrix()}),a.createElement("group",r,a.createElement("group",{ref:f,matrixAutoUpdate:!1},s))});class Ke extends me{constructor(){super({uniforms:{time:{value:0},pixelRatio:{value:1}},vertexShader:`
        uniform float pixelRatio;
        uniform float time;
        attribute float size;  
        attribute float speed;  
        attribute float opacity;
        attribute vec3 noise;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
          modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2;
          modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2;
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectionPostion = projectionMatrix * viewPosition;
          gl_Position = projectionPostion;
          gl_PointSize = size * 25. * pixelRatio;
          gl_PointSize *= (1.0 / - viewPosition.z);
          vColor = color;
          vOpacity = opacity;
        }
      `,fragmentShader:`
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float strength = 0.05 / distanceToCenter - 0.1;
          gl_FragColor = vec4(vColor, strength * vOpacity);
          #include <tonemapping_fragment>
          #include <${ke>=154?"colorspace_fragment":"encodings_fragment"}>
        }
      `})}get time(){return this.uniforms.time.value}set time(e){this.uniforms.time.value=e}get pixelRatio(){return this.uniforms.pixelRatio.value}set pixelRatio(e){this.uniforms.pixelRatio.value=e}}const be=s=>s&&s.constructor===Float32Array,Qe=s=>[s.r,s.g,s.b],we=s=>s instanceof K||s instanceof x||s instanceof j,Se=s=>Array.isArray(s)?s:we(s)?s.toArray():[s,s,s];function T(s,e,t){return a.useMemo(()=>{if(e!==void 0){if(be(e))return e;if(e instanceof Q){const i=Array.from({length:s*3},()=>Qe(e)).flat();return Float32Array.from(i)}else if(we(e)||Array.isArray(e)){const i=Array.from({length:s*3},()=>Se(e)).flat();return Float32Array.from(i)}return Float32Array.from({length:s},()=>e)}return Float32Array.from({length:s},t)},[e])}const fe=a.forwardRef(({noise:s=1,count:e=100,speed:t=1,opacity:i=1,scale:n=1,size:o,color:c,children:r,...l},f)=>{a.useMemo(()=>je({SparklesImplMaterial:Ke}),[]);const d=a.useRef(null),u=he(p=>p.viewport.dpr),h=Se(n),b=a.useMemo(()=>Float32Array.from(Array.from({length:e},()=>h.map(H.randFloatSpread)).flat()),[e,...h]),y=T(e,o,Math.random),v=T(e,i),w=T(e,t),g=T(e*3,s),M=T(c===void 0?e*3:e,be(c)?c:new Q(c),()=>1);return W(p=>{d.current&&d.current.material&&(d.current.material.time=p.clock.elapsedTime)}),a.useImperativeHandle(f,()=>d.current,[]),a.createElement("points",P({key:`particle-${e}-${JSON.stringify(n)}`},l,{ref:d}),a.createElement("bufferGeometry",null,a.createElement("bufferAttribute",{attach:"attributes-position",args:[b,3]}),a.createElement("bufferAttribute",{attach:"attributes-size",args:[y,1]}),a.createElement("bufferAttribute",{attach:"attributes-opacity",args:[v,1]}),a.createElement("bufferAttribute",{attach:"attributes-speed",args:[w,1]}),a.createElement("bufferAttribute",{attach:"attributes-color",args:[M,3]}),a.createElement("bufferAttribute",{attach:"attributes-noise",args:[g,3]})),r||a.createElement("sparklesImplMaterial",{transparent:!0,pixelRatio:u,depthWrite:!1}))});function et(s){const e=a.useMemo(()=>{const i=document.createElement("canvas");i.width=i.height=128;const n=i.getContext("2d"),o=n.createRadialGradient(128/2,128/2,0,128/2,128/2,128/2);o.addColorStop(0,s),o.addColorStop(.4,s+"55"),o.addColorStop(1,"transparent"),n.fillStyle=o,n.fillRect(0,0,128,128);const c=new He(i);return c.needsUpdate=!0,c},[s]);return a.useEffect(()=>()=>e.dispose(),[e]),e}function tt({position:s,rotation:e,scale:t=1,rows:i=4,accent:n,feather:o,muted:c,dark:r,activeRow:l=-1}){const d=.34+i*.3,u=r?"#12172a":"#ffffff",h=r?"#2a3350":"#dfe3f0";return m.jsxs("group",{position:s,rotation:e,scale:t,children:[m.jsxs(Xe,{args:[2.4,d,.08],radius:.05,smoothness:4,children:[m.jsx("meshPhysicalMaterial",{color:u,transparent:!0,opacity:r?.42:.7,roughness:.18,metalness:.1,clearcoat:.6,clearcoatRoughness:.25}),m.jsx(qe,{scale:1.001,color:n})]}),m.jsxs("mesh",{position:[0,d/2-.17,.05],children:[m.jsx("boxGeometry",{args:[2.4-.2,.16,.02]}),m.jsx("meshStandardMaterial",{color:n,emissive:n,emissiveIntensity:r?.7:.25,toneMapped:!1})]}),Array.from({length:i}).map((b,y)=>{const v=d/2-.42-y*.3,w=y===l,g=(2.4-.4)*(.5+y*37%40/100);return m.jsx("group",{children:m.jsxs("mesh",{position:[-(2.4-.4-g)/2,v,.05],children:[m.jsx("boxGeometry",{args:[g,.1,.015]}),m.jsx("meshStandardMaterial",{color:w?o:h,emissive:w?o:c,emissiveIntensity:w?r?.9:.4:r?.12:.04,transparent:!0,opacity:w?1:.75,toneMapped:!1})]})},y)})]})}function nt({accent:s,feather:e,dark:t}){const i=et(s),n=a.useRef(null),o=Y();return W((c,r)=>{o||!n.current||(n.current.rotation.y+=r*.25,n.current.rotation.x+=r*.08)}),m.jsxs("group",{children:[m.jsx("sprite",{scale:[7,7,1],children:m.jsx("spriteMaterial",{map:i,transparent:!0,depthWrite:!1,blending:Oe,opacity:t?.85:.4})}),m.jsxs("mesh",{ref:n,children:[m.jsx("icosahedronGeometry",{args:[.72,1]}),m.jsx("meshStandardMaterial",{color:s,emissive:s,emissiveIntensity:t?1.1:.5,roughness:.25,metalness:.4,flatShading:!0,toneMapped:!1})]}),m.jsxs("mesh",{scale:1.28,children:[m.jsx("icosahedronGeometry",{args:[.72,1]}),m.jsx("meshBasicMaterial",{color:e,wireframe:!0,transparent:!0,opacity:t?.22:.16})]})]})}function it({points:s,color:e}){const t=a.useMemo(()=>new Ie({color:e,transparent:!0,opacity:.22}),[e]),i=a.useMemo(()=>s.map(n=>new De(new Te().setFromPoints([new x(0,0,0),new x(...n)]),t)),[s,t]);return a.useEffect(()=>()=>{for(const n of i)n.geometry.dispose();t.dispose()},[i,t]),m.jsx("group",{children:i.map((n,o)=>m.jsx("primitive",{object:n},o))})}const Ee=[{pos:[-3.1,1.1,-1.2],rot:[.05,.5,.04],scale:1,rows:4,active:1,float:1.4},{pos:[3.2,.6,-1.6],rot:[-.04,-.5,-.03],scale:.95,rows:5,active:2,float:1.1},{pos:[-2.4,-1.5,.6],rot:[.06,.35,-.05],scale:.85,rows:3,active:0,float:1.7},{pos:[2.6,-1.6,.2],rot:[-.05,-.3,.05],scale:.9,rows:4,active:3,float:1.3},{pos:[.2,2.3,-2.6],rot:[.1,.1,0],scale:.7,rows:3,active:-1,float:1.9}],st=Ee.map(s=>s.pos);function ot({colors:s}){const e=a.useRef(null),t=Y(),{accent:i,feather:n,muted:o,dark:c}=s;return W(r=>{if(t||!e.current)return;const l=r.clock.getElapsedTime(),f=r.pointer.x,d=r.pointer.y;e.current.rotation.y=H.lerp(e.current.rotation.y,f*.28+Math.sin(l*.12)*.08,.04),e.current.rotation.x=H.lerp(e.current.rotation.x,-d*.18,.04)}),m.jsxs("group",{ref:e,children:[m.jsx(nt,{...s}),m.jsx(it,{color:i,points:st}),Ee.map((r,l)=>m.jsx(Ze,{speed:t?0:r.float,rotationIntensity:t?0:.25,floatIntensity:t?0:.7,floatingRange:[-.18,.18],children:m.jsx(tt,{position:r.pos,rotation:r.rot,scale:r.scale,rows:r.rows,activeRow:r.active,accent:i,feather:n,muted:o,dark:c})},l)),m.jsx(fe,{count:c?90:40,scale:[13,9,8],size:c?2.4:1.6,speed:t?0:.32,opacity:c?.6:.4,color:n}),m.jsx(fe,{count:c?70:30,scale:[16,11,10],size:c?1.8:1.2,speed:t?0:.2,opacity:c?.5:.3,color:i})]})}function ct({colors:s}){const e=Y();return m.jsxs(Re,{dpr:[1,2],camera:{position:[0,0,8],fov:42},gl:{antialias:!0,alpha:!0,powerPreference:"high-performance"},frameloop:e?"demand":"always",style:{pointerEvents:"none"},"aria-hidden":"true",children:[m.jsx("ambientLight",{intensity:s.dark?.5:.9}),m.jsx("pointLight",{position:[6,4,6],intensity:s.dark?40:20,color:s.accent}),m.jsx("pointLight",{position:[-6,-3,4],intensity:s.dark?26:14,color:s.feather}),m.jsx(ot,{colors:s})]})}export{ct as HeroScene};
