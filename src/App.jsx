import { useState, useRef, useEffect } from "react";

// ── API ──────────────────────────────────────────────────────────
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const callClaude = async (msgs, system = "") => {
  const body = { model: MODEL, max_tokens: 1500, messages: msgs };
  if (system) body.system = system;
  const r = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });
  return r.json();
};
const extractText = (d) => (d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");

// ── CONSTANTS ─────────────────────────────────────────────────────
const FLAG = { KR:"🇰🇷",US:"🇺🇸",JP:"🇯🇵",TH:"🇹🇭",ID:"🇮🇩",VN:"🇻🇳",BR:"🇧🇷",MY:"🇲🇾",SA:"🇸🇦",TW:"🇹🇼",FR:"🇫🇷",MX:"🇲🇽" };
const LANGS = ["한국어","영어","일본어","태국어","인도네시아어","베트남어","중국어","스페인어","프랑스어"];
const NAV = [
  { id:"style",   icon:"✦", label:"AI 스타일" },
  { id:"make",    icon:"🎬", label:"영상 만들기" },
  { id:"schedule",icon:"📅", label:"예약" },
  { id:"manage",  icon:"📋", label:"관리" },
  { id:"perf",    icon:"📊", label:"성과" },
  { id:"comments",icon:"💬", label:"댓글" },
];
const PERF_DATA = {
  "7d": {views:"284K",likes:"18.2K",comments:"2,140",followers:"+892"},
  "30d":{views:"1.2M",likes:"74K",comments:"8,900",followers:"+3.4K"},
  "90d":{views:"3.8M",likes:"230K",comments:"27K",followers:"+11K"},
};
const STATUS_L = {published:"게시됨",scheduled:"예약됨",draft:"초안",failed:"실패"};
const STATUS_C = {published:"#059669",scheduled:"#8435F3",draft:"#9CA3AF",failed:"#E11D48"};
const INIT_POSTS = [
  {id:1,title:"유리피부 루틴 공개 ✨",date:"2026-03-28",time:"09:00",country:"KR",status:"published",thumb:"✨"},
  {id:2,title:"MILLIMILLI 신제품 리뷰",date:"2026-03-30",time:"20:00",country:"JP",status:"scheduled",thumb:"💎"},
  {id:3,title:"#kbeauty 500달톤 비밀",date:"2026-04-01",time:"19:30",country:"US",status:"scheduled",thumb:"🔬"},
  {id:4,title:"나이트 스킨케어 루틴",date:"2026-04-03",time:"21:00",country:"TH",status:"draft",thumb:"🌙"},
];
const INIT_COMMENTS = [
  {id:1,user:"@beauty_lover_th",text:"OMG this product is amazing! Where can I buy it?",type:"sales",status:"pending",replied:false},
  {id:2,user:"@skincare_jp",text:"너무 예뻐요! 제품 구매 링크 알려주세요",type:"sales",status:"pending",replied:false},
  {id:3,user:"@kbeauty_fan",text:"이 루틴 진짜 최고야! 팔로우 완료 💕",type:"positive",status:"auto_replied",replied:true},
  {id:4,user:"@troll123",text:"광고인 거 티 나잖아요",type:"negative",status:"hidden",replied:false},
];
const INIT_TEMPLATES = [
  {id:1,label:"감사 KR",text:"감사해요 💕 @millimilli_official 에서 더 확인해보세요!"},
  {id:2,label:"감사 EN",text:"Thank you so much! 💕 Check @millimilli_official for more!"},
  {id:3,label:"쇼핑 KR",text:"구매는 bio 링크에서! 지금 한정 할인 중 🎁"},
  {id:4,label:"부정 대응",text:"소중한 의견 감사해요. DM으로 이야기 나눠요 😊"},
];

const C = {
  purple:"#8435F3", purpleDark:"#5B2EFF", purpleLight:"#8E5CFF",
  purpleBg:"rgba(132,53,243,0.06)", purpleBorder:"rgba(132,53,243,0.3)",
  gray50:"#F9FAFB", gray100:"#F3F4F6", gray200:"#E5E7EB",
  gray400:"#9CA3AF", gray500:"#6B7280", gray700:"#374151", gray900:"#111827",
  green:"#059669", greenBg:"#D1FAE5", amber:"#D97706", amberBg:"#FFFBEB",
  red:"#E11D48", redBg:"#FFE4E6", white:"#FFFFFF",
};

// ── PHOTO UPLOAD COMPONENT ────────────────────────────────────────
function PhotoUpload({ label, icon, value, onChange }) {
  const ref = useRef();
  return (
    <div style={{flex:1}}>
      <div style={{fontSize:12,fontWeight:600,color:C.gray500,marginBottom:8}}>{label}</div>
      <div onClick={()=>ref.current.click()} style={{
        height:140, borderRadius:12, border:`2px dashed ${value?"transparent":C.gray200}`,
        background:value?`url(${value}) center/cover no-repeat`:`${C.gray50}`,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        cursor:"pointer",position:"relative",overflow:"hidden",transition:"all .2s",
      }}>
        {!value && <>
          <div style={{fontSize:28,marginBottom:6}}>{icon}</div>
          <div style={{fontSize:12,color:C.gray400}}>클릭해서 업로드</div>
        </>}
        {value && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity .2s"}}
          onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
          <span style={{color:"#fff",fontSize:12,fontWeight:600}}>변경</span>
        </div>}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
        const file=e.target.files[0]; if(!file)return;
        const reader=new FileReader(); reader.onload=ev=>onChange(ev.target.result); reader.readAsDataURL(file);
      }}/>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("style");

  // TikTok
  const [tiktokToken, setTiktokToken] = useState(localStorage.getItem("tt_token")||"");
  const [tiktokUser, setTiktokUser] = useState(localStorage.getItem("tt_user")||"");
  const [tiktokUploading, setTiktokUploading] = useState(false);
  const [tiktokUploadResult, setTiktokUploadResult] = useState(null);
  const [tiktokUploadError, setTiktokUploadError] = useState("");

  // Style
  const [facePhoto, setFacePhoto] = useState(null);
  const [bgPhoto, setBgPhoto] = useState(null);
  const [productPhoto, setProductPhoto] = useState(null);
  const [productName, setProductName] = useState("MILLIMILLI 크림");
  const [charName, setCharName] = useState("MILLI");
  const [charCountry, setCharCountry] = useState("KR");
  const [charLang, setCharLang] = useState("한국어");
  const [styleSaved, setStyleSaved] = useState(false);

  // Make (콘텐츠+영상 통합)
  const [makeStep, setMakeStep] = useState(1); // 1:URL입력 2:분석중 3:편집 4:생성중 5:완료
  const [refVideoUrl, setRefVideoUrl] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [editScript, setEditScript] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const [heygenResult, setHeygenResult] = useState(null);
  const [heygenError, setHeygenError] = useState("");
  const [heygenProgress, setHeygenProgress] = useState(0);

  // Schedule
  const [posts, setPosts] = useState(INIT_POSTS);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newCountry, setNewCountry] = useState("KR");
  const [schedOk, setSchedOk] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  // Manage
  const [mgmtFilter, setMgmtFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);

  // Perf
  const [period, setPeriod] = useState("7d");

  // Comments
  const [comments, setComments] = useState(INIT_COMMENTS);
  const [templates] = useState(INIT_TEMPLATES);
  const [auto, setAuto] = useState({simple:true,negative:true,sales:true});
  const [selectedComment, setSelectedComment] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [aiReplying, setAiReplying] = useState(false);

  // TikTok OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code"), state = params.get("state");
    if (!code || state !== sessionStorage.getItem("tt_state")) return;
    const CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
    const CLIENT_SECRET = import.meta.env.VITE_TIKTOK_CLIENT_SECRET;
    fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({client_key:CLIENT_KEY,client_secret:CLIENT_SECRET,code,grant_type:"authorization_code",redirect_uri:window.location.origin+"/tiktok-callback",code_verifier:sessionStorage.getItem("tt_code_verifier")})
    }).then(r=>r.json()).then(data=>{
      if(data.access_token){
        localStorage.setItem("tt_token",data.access_token); setTiktokToken(data.access_token);
        fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",{headers:{"Authorization":"Bearer "+data.access_token}})
          .then(r=>r.json()).then(u=>{const n=u?.data?.user?.display_name||"";localStorage.setItem("tt_user",n);setTiktokUser(n);});
        window.history.replaceState({},"","/");
      }
    });
  }, []);

  const loginTikTok = async () => {
    const CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
    const redirectUri = encodeURIComponent(window.location.origin+"/tiktok-callback");
    const state = Math.random().toString(36).slice(2);
    const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
    const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    sessionStorage.setItem("tt_state",state); sessionStorage.setItem("tt_code_verifier",codeVerifier);
    window.location.href=`https://www.tiktok.com/v2/auth/authorize?client_key=${CLIENT_KEY}&response_type=code&scope=${encodeURIComponent("user.info.basic,video.upload,video.list")}&redirect_uri=${redirectUri}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  };
  const logoutTikTok = () => { localStorage.removeItem("tt_token"); localStorage.removeItem("tt_user"); setTiktokToken(""); setTiktokUser(""); };

  // 영상 분석 + 스크립트 생성
  const analyzeAndGenerate = async () => {
    if (!refVideoUrl.trim()) return;
    setMakeStep(2);
    try {
      const styleDesc = `캐릭터: ${charName}, 언어: ${charLang}, 국가: ${FLAG[charCountry]||charCountry}${facePhoto?", 얼굴+의상 사진 있음":""}${bgPhoto?", 배경 사진 있음":""}${productPhoto?", 제품: "+productName+" 사진 있음":""}`;
      const data = await callClaude(
        [{role:"user",content:`TikTok 영상 URL: ${refVideoUrl}\n내 스타일 정보: ${styleDesc}\n\n이 영상을 분석해서 내 스타일로 각색해줘.`}],
        `당신은 K뷰티 TikTok 콘텐츠 전문가입니다. 주어진 TikTok URL의 영상 구성(훅, 전개, 마무리, 제품 사용법, 말투, 템포)을 분석하고, 주어진 캐릭터와 제품으로 최대한 유사하게 각색해주세요. 제품이 있다면 영상 전반에 자연스럽게 등장시키세요.
반드시 아래 JSON만 응답하세요 (마크다운 없이):
{"analysis":"원본 영상 구성 분석 (훅방식/전개/제품등장타이밍/마무리)","hook":"첫 3초 훅 (원본과 유사한 방식으로, 30자 이내)","script":"30-40초 스크립트 (원본 템포/말투 따라가되 제품명 자연스럽게 포함, 말하기 좋게)","caption":"영상 캡션 (이모지 포함, 2줄)","hashtags":"#kbeauty #밀리밀리 #스킨케어 #뷰티 #skincare #glowskin","product_placement":"영상에서 제품이 등장하는 타이밍과 방식 설명"}`
      );
      const txt = extractText(data).replace(/```json|```/g,"").trim();
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) {
        const result = JSON.parse(m[0]);
        setAnalysisResult(result);
        setEditScript(result.script||"");
        setEditCaption(result.caption||"");
        setEditHashtags(result.hashtags||"");
        setMakeStep(3);
      } else { setMakeStep(1); }
    } catch(e) { console.error(e); setMakeStep(1); }
  };

  // HeyGen 영상 생성
  // base64 이미지 → HeyGen 업로드 → asset id
      const uploadPhotoToHeygen = async (base64, HEYGEN_KEY) => {
    const mime = base64.includes("image/png") ? "image/png" : "image/jpeg";
    const byteStr = atob(base64.split(",")[1]);
    const ab = new ArrayBuffer(byteStr.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
    const r = await fetch("https://upload.heygen.com/v1/asset", {
      method: "POST",
      headers: { "X-Api-Key": HEYGEN_KEY, "Content-Type": mime },
      body: ab
    });
    const text = await r.text();
    let d;
    try { d = JSON.parse(text); } catch(e) { throw new Error("파싱실패: " + text.slice(0,200)); }
    if (!d.data?.id) throw new Error("업로드실패: " + JSON.stringify(d));
    return d.data.id;
  };

  const generateVideo = async () => {
    if (!editScript.trim()) return;
    setMakeStep(4); setHeygenError(""); setHeygenProgress(5);
    const HEYGEN_KEY = import.meta.env.VITE_HEYGEN_API_KEY;
    try {
      // 1. 얼굴/의상 사진 → Talking Photo or 기본 아바타
      let character;
      // 얼굴 사진이 있어도 일단 기본 아바타 사용 (talking_photo는 별도 생성 필요)
      character = { type:"avatar", avatar_id:"Abigail_expressive_2024112501", avatar_style:"normal" };

      // 2. 배경 사진
      let background = { type:"color", value:"#FAFAF8" };
      if (bgPhoto) {
        setHeygenProgress(28);
        const bgId = await uploadPhotoToHeygen(bgPhoto, HEYGEN_KEY);
        background = { type:"image", image_asset_id: bgId };
      }

      // 3. 제품 사진 오버레이
      let elements = [];
      if (productPhoto) {
        setHeygenProgress(33);
        const prodId = await uploadPhotoToHeygen(productPhoto, HEYGEN_KEY);
        elements.push({
          type: "image",
          asset_id: prodId,
          width: 0.28,
          height: 0.18,
          x: 0.64,
          y: 0.74,
          fit: "contain",
        });
      }

      setHeygenProgress(38);
      const videoInput = { character, voice:{type:"text",input_text:editScript,voice_id:"1bd001e7e50f421d891986aad5158bc8"}, background };
      if (elements.length > 0) videoInput.elements = elements;

      const res = await fetch("/heygen/v2/video/generate", {
        method:"POST",
        headers:{"X-Api-Key":HEYGEN_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({
          video_inputs:[videoInput],
          dimension:{width:720,height:1280},
        })
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error.message||"생성 실패");
      const videoId = data.data?.video_id;
      if(!videoId) throw new Error("video_id 없음");

      // video_id 저장하고 대기 화면으로
      localStorage.setItem("pending_video_id", videoId);
      localStorage.setItem("pending_video_key", HEYGEN_KEY);
      setHeygenProgress(50);
      
      // 최대 10분 대기
      let attempts = 0;
      const timer = setInterval(async()=>{
        try {
          const sr = await fetch("/heygen/v1/video_status.get?video_id="+videoId,{headers:{"X-Api-Key":HEYGEN_KEY}});
          const sd = await sr.json();
          setHeygenProgress(Math.min(50+attempts*3,95));
          if(sd.data?.status==="completed"){
            clearInterval(timer);
            localStorage.removeItem("pending_video_id");
            setHeygenResult({videoUrl:sd.data?.video_url,thumbnailUrl:sd.data?.thumbnail_url});
            setMakeStep(5);
          } else if(sd.data?.status==="failed"){
            clearInterval(timer); throw new Error("영상 생성 실패");
          }
          attempts++;
          if(attempts>120){ 
            clearInterval(timer);
            setHeygenError("시간 초과 — app.heygen.com에서 영상 확인하세요");
            setMakeStep(3);
          }
        } catch(e){ clearInterval(timer); setHeygenError(e.message); setMakeStep(3); }
      },5000);
    } catch(e){ setHeygenError(e.message); setMakeStep(3); }
  };

  const uploadToTikTok = async () => {
    if(!tiktokToken||!heygenResult?.videoUrl) return;
    setTiktokUploading(true); setTiktokUploadError(""); setTiktokUploadResult(null);
    try {
      const cap = `${editCaption}\n${editHashtags}`.trim();
      const initRes = await fetch("/tiktok/v2/post/publish/video/init/",{method:"POST",
        headers:{"Authorization":"Bearer "+tiktokToken,"Content-Type":"application/json; charset=UTF-8"},
        body:JSON.stringify({post_info:{title:cap||"✨ K-Beauty #kbeauty #millimilli",privacy_level:"SELF_ONLY",disable_duet:false,disable_comment:false,disable_stitch:false},source_info:{source:"PULL_FROM_URL",video_url:heygenResult.videoUrl}})
      });
      const initData = await initRes.json();
      if(initData.error?.code&&initData.error.code!=="ok") throw new Error(initData.error.message);
      const publishId = initData.data?.publish_id;
      if(!publishId) throw new Error("publish_id 없음");
      let attempts=0;
      while(attempts<20){
        await new Promise(r=>setTimeout(r,3000));
        const sr = await fetch("/tiktok/v2/post/publish/status/fetch/",{method:"POST",headers:{"Authorization":"Bearer "+tiktokToken,"Content-Type":"application/json; charset=UTF-8"},body:JSON.stringify({publish_id:publishId})});
        const sd = await sr.json();
        if(sd.data?.status==="PUBLISH_COMPLETE"){setTiktokUploadResult({status:"✅ TikTok 업로드 완료!"});setTiktokUploading(false);return;}
        else if(sd.data?.status==="FAILED") throw new Error("업로드 실패");
        attempts++;
      }
      throw new Error("시간 초과");
    } catch(e){setTiktokUploadError(e.message);setTiktokUploading(false);}
  };

  const genAiReply = async () => {
    if(!selectedComment) return; setAiReplying(true);
    try{const data=await callClaude([{role:"user",content:`K뷰티 인플루언서 댓글 답글: "${selectedComment.text}". 짧게 이모지 1-2개.`}]);setReplyText(extractText(data).trim());}
    catch{}setAiReplying(false);
  };

  const calDays=()=>({first:new Date(calYear,calMonth,1).getDay(),total:new Date(calYear,calMonth+1,0).getDate()});
  const postsOnDay=(d)=>posts.filter(p=>{const dt=new Date(p.date);return dt.getDate()===d&&dt.getMonth()===calMonth&&dt.getFullYear()===calYear;});

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.gray50,fontFamily:"'Pretendard','Apple SD Gothic Neo',-apple-system,sans-serif",color:C.gray900}}>

      {/* ── SIDEBAR ── */}
      <div style={{width:240,flexShrink:0,position:"fixed",top:0,left:0,height:"100vh",background:"rgba(255,255,255,0.97)",backdropFilter:"blur(12px)",borderRight:`1px solid ${C.gray200}`,display:"flex",flexDirection:"column",zIndex:50}}>
        <div style={{padding:"22px 20px 18px",borderBottom:`1px solid ${C.gray200}`}}>
          <div style={{fontSize:13,fontWeight:800,letterSpacing:".1em",color:C.gray900,marginBottom:3}}>AUTO TIKTOK STUDIO</div>
          <div style={{fontSize:11,color:C.gray400}}>AI 버추얼 인플루언서</div>
        </div>

        {/* TikTok 상태 */}
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.gray200}`}}>
          {tiktokToken ? (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"9px 12px",borderRadius:8,background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,marginBottom:8}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#4ade80",flexShrink:0,display:"inline-block"}}/>
                <span style={{fontSize:12,fontWeight:600,color:C.purple,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>@{tiktokUser||"연결됨"}</span>
              </div>
              <button onClick={logoutTikTok} style={{width:"100%",padding:"6px",borderRadius:6,border:`1px solid ${C.gray200}`,background:"transparent",fontSize:11,color:C.gray500,cursor:"pointer"}}>로그아웃</button>
            </div>
          ):(
            <button onClick={loginTikTok} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              🔗 TikTok 연결
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{padding:"10px",flex:1}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",
              background:tab===n.id?C.purpleBg:"transparent",color:tab===n.id?C.purple:C.gray500,
              fontWeight:tab===n.id?600:400,fontSize:13,cursor:"pointer",marginBottom:2,textAlign:"left",
              borderLeft:tab===n.id?`3px solid ${C.purple}`:"3px solid transparent",
            }}>
              <span style={{fontSize:15,width:20,textAlign:"center"}}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>

        {/* 저장된 스타일 */}
        {styleSaved && (
          <div style={{padding:"14px 16px",borderTop:`1px solid ${C.gray200}`,background:C.gray50}}>
            <div style={{fontSize:10,fontWeight:600,color:C.gray400,letterSpacing:".05em",marginBottom:8}}>활성 스타일</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {facePhoto
                ? <img src={facePhoto} style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt="face"/>
                : <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",flexShrink:0}}>✦</div>
              }
              <div>
                <div style={{fontSize:13,fontWeight:600,color:C.gray900}}>{charName}</div>
                <div style={{fontSize:11,color:C.gray400}}>{FLAG[charCountry]} {charLang}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN ── */}
      <div style={{marginLeft:240,flex:1}}>
        {/* Topbar */}
        <div style={{height:54,background:C.white,borderBottom:`1px solid ${C.gray200}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",position:"sticky",top:0,zIndex:40}}>
          <span style={{fontSize:16,fontWeight:700}}>{NAV.find(n=>n.id===tab)?.label}</span>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {!tiktokToken&&<span style={{padding:"4px 12px",borderRadius:6,background:C.amberBg,border:`1px solid #FCD34D`,fontSize:11,color:C.amber}}>⚠ TikTok 미연결</span>}
            <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700}}>M</div>
          </div>
        </div>

        <div style={{padding:"28px",maxWidth:1000}}>

          {/* ══ AI 스타일 ══ */}
          {tab==="style" && (
            <div>
              <div style={{marginBottom:24}}>
                <div style={{fontSize:20,fontWeight:800,marginBottom:6}}>AI 스타일 설정</div>
                <div style={{fontSize:13,color:C.gray400}}>사진 3장과 기본 정보만 입력하면 나만의 버추얼 인플루언서가 완성돼요</div>
              </div>

              {/* 사진 업로드 */}
              <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:28,marginBottom:20}}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>📸 사진 업로드</div>
                <div style={{fontSize:12,color:C.gray400,marginBottom:20}}>업로드한 사진을 기반으로 AI 아바타가 생성돼요</div>
                <div style={{display:"flex",gap:16}}>
                  <PhotoUpload label="얼굴+의상 사진" icon="🧖‍♀️" value={facePhoto} onChange={setFacePhoto}/>
                  <PhotoUpload label="배경 사진" icon="🌸" value={bgPhoto} onChange={setBgPhoto}/>
                  <PhotoUpload label="제품 사진" icon="💎" value={productPhoto} onChange={setProductPhoto}/>
                </div>
              </div>

              {/* 기본 정보 */}
              <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:28,marginBottom:20}}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:20}}>📝 기본 정보</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:C.gray500,marginBottom:8}}>캐릭터 이름</div>
                    <input value={charName} onChange={e=>setCharName(e.target.value)}
                      style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:9,padding:"11px 14px",fontSize:14,fontWeight:600,outline:"none",boxSizing:"border-box"}}
                      placeholder="예: MILLI"/>
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:C.gray500,marginBottom:8}}>타겟 국가</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {Object.keys(FLAG).slice(0,6).map(c=>(
                        <button key={c} onClick={()=>setCharCountry(c)} style={{padding:"7px 10px",borderRadius:7,border:`1.5px solid ${charCountry===c?C.purple:C.gray200}`,background:charCountry===c?C.purpleBg:C.white,fontSize:16,cursor:"pointer"}}>
                          {FLAG[c]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:C.gray500,marginBottom:8}}>주요 언어</div>
                    <select value={charLang} onChange={e=>setCharLang(e.target.value)}
                      style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:9,padding:"11px 14px",fontSize:14,outline:"none",background:C.white,boxSizing:"border-box"}}>
                      {LANGS.map(l=><option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              {/* 제품명 */}
              <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"16px 24px",marginBottom:20,display:"flex",alignItems:"center",gap:16}}>
                <div style={{fontSize:14,fontWeight:600,flexShrink:0}}>💎 제품명</div>
                <input value={productName} onChange={e=>setProductName(e.target.value)}
                  style={{flex:1,border:`1px solid ${C.gray200}`,borderRadius:9,padding:"10px 14px",fontSize:14,outline:"none"}}
                  placeholder="예: MILLIMILLI 500달톤 크림"/>
                {productPhoto && <span style={{padding:"4px 12px",borderRadius:20,background:C.greenBg,color:C.green,fontSize:12,fontWeight:500,flexShrink:0}}>✓ 사진 있음</span>}
              </div>

              {/* 미리보기 + 저장 */}
              <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:28}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                  <div style={{fontSize:15,fontWeight:700}}>✦ 스타일 미리보기</div>
                  <button onClick={()=>setStyleSaved(true)} style={{padding:"10px 24px",borderRadius:9,border:"none",background:styleSaved?C.green:`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                    {styleSaved?"✓ 저장됨":"💾 스타일 저장"}
                  </button>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:24}}>
                  {/* 아바타 프리뷰 */}
                  <div style={{width:120,height:200,borderRadius:16,background:"#111",position:"relative",overflow:"hidden",flexShrink:0}}>
                    {bgPhoto && <img src={bgPhoto} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:.4}} alt="bg"/>}
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
                      {facePhoto
                        ? <img src={facePhoto} style={{width:70,height:70,borderRadius:"50%",objectFit:"cover",border:"3px solid rgba(255,255,255,.4)"}} alt="face"/>
                        : <div style={{width:70,height:70,borderRadius:"50%",background:`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff"}}>✦</div>
                      }
                      
                    </div>
                    <div style={{position:"absolute",bottom:8,left:0,right:0,textAlign:"center",fontSize:11,fontWeight:700,color:"#fff"}}>@{charName}</div>
                  </div>
                  <div>
                    <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>{charName}</div>
                    <div style={{fontSize:14,color:C.gray400,marginBottom:12}}>{FLAG[charCountry]} {charLang}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {facePhoto&&<span style={{padding:"4px 12px",borderRadius:20,background:C.greenBg,color:C.green,fontSize:12,fontWeight:500}}>✓ 얼굴+의상</span>}
                      {bgPhoto&&<span style={{padding:"4px 12px",borderRadius:20,background:C.greenBg,color:C.green,fontSize:12,fontWeight:500}}>✓ 배경</span>}
                      {productPhoto&&<span style={{padding:"4px 12px",borderRadius:20,background:C.purpleBg,color:C.purple,fontSize:12,fontWeight:500}}>✓ 제품</span>}
                      {!facePhoto&&!bgPhoto&&!productPhoto&&<span style={{fontSize:13,color:C.gray400}}>사진을 업로드하면 여기에 표시돼요</span>}
                    </div>
                    <div style={{marginTop:16,padding:"12px 16px",background:C.purpleBg,borderRadius:10,border:`1px solid ${C.purpleBorder}`}}>
                      <div style={{fontSize:12,color:C.gray500,marginBottom:4}}>설정 완료 후 영상 만들기 탭에서</div>
                      <div style={{fontSize:13,fontWeight:600,color:C.purple}}>TikTok URL → 분석 → 내 스타일로 영상 생성 ✨</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ 영상 만들기 ══ */}
          {tab==="make" && (
            <div>
              <div style={{marginBottom:24}}>
                <div style={{fontSize:20,fontWeight:800,marginBottom:6}}>영상 만들기</div>
                <div style={{fontSize:13,color:C.gray400}}>TikTok 링크를 넣으면 내 스타일로 자동 분석 · 각색 · 영상 생성까지</div>
              </div>

              {/* 스텝 인디케이터 */}
              <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:28,background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"14px 20px"}}>
                {[["1","링크 입력"],["2","AI 분석"],["3","스크립트 편집"],["4","영상 생성"],["5","완료"]].map(([num,label],i)=>{
                  const step = parseInt(num);
                  const isActive = makeStep === step;
                  const isDone = makeStep > step;
                  return (
                    <div key={num} style={{display:"flex",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 8px",borderRadius:8,background:isActive?C.purpleBg:"transparent"}}>
                        <div style={{width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,background:isActive?C.purple:isDone?C.green:C.gray200,color:isActive||isDone?"#fff":C.gray400}}>
                          {isDone?"✓":num}
                        </div>
                        <span style={{fontSize:12,fontWeight:isActive?700:400,color:isActive?C.purple:isDone?C.green:C.gray400,whiteSpace:"nowrap"}}>{label}</span>
                      </div>
                      {i<4&&<span style={{fontSize:12,color:C.gray200,margin:"0 4px"}}>→</span>}
                    </div>
                  );
                })}
              </div>

              {/* STEP 1: URL 입력 */}
              {makeStep===1 && (
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:32,maxWidth:640}}>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>🔗 참고할 TikTok 영상 링크</div>
                  <div style={{fontSize:13,color:C.gray400,marginBottom:20}}>이 영상의 구성과 스타일을 분석해서 내 캐릭터로 똑같이 만들어줄게요</div>
                  <input value={refVideoUrl} onChange={e=>setRefVideoUrl(e.target.value)}
                    style={{width:"100%",border:`1.5px solid ${C.gray200}`,borderRadius:10,padding:"13px 16px",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:16}}
                    placeholder="https://www.tiktok.com/@user/video/..."/>
                  {!styleSaved && (
                    <div style={{padding:"10px 14px",background:C.amberBg,border:`1px solid #FCD34D`,borderRadius:9,marginBottom:16,fontSize:12,color:C.amber}}>
                      💡 AI 스타일 탭에서 먼저 스타일을 저장하면 더 정확하게 만들어줘요!
                      <span onClick={()=>setTab("style")} style={{marginLeft:8,textDecoration:"underline",cursor:"pointer",fontWeight:600}}>스타일 설정 →</span>
                    </div>
                  )}
                  <button onClick={analyzeAndGenerate} disabled={!refVideoUrl.trim()}
                    style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:refVideoUrl.trim()?`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`:C.gray200,color:refVideoUrl.trim()?"#fff":C.gray400,fontSize:15,fontWeight:700,cursor:refVideoUrl.trim()?"pointer":"default"}}>
                    ⚡ AI로 분석하고 영상 만들기
                  </button>
                  <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${C.gray100}`}}>
                    <div style={{fontSize:12,color:C.gray400,marginBottom:10}}>TikTok 트렌드 참고</div>
                    <div style={{display:"flex",gap:8}}>
                      {[["# 해시태그","https://ads.tiktok.com/business/creativecenter/trend/hashtag/pc/en"],["♪ 음악","https://ads.tiktok.com/business/creativecenter/trend/sound/pc/en"],["▷ 바이럴","https://ads.tiktok.com/business/creativecenter/trend/video/pc/en"]].map(([l,u],i)=>(
                        <a key={i} href={u} target="_blank" rel="noreferrer" style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${C.gray200}`,fontSize:12,color:C.gray500,textDecoration:"none",textAlign:"center",display:"block"}}>
                          {l} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: 분석 중 */}
              {makeStep===2 && (
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:"60px 40px",textAlign:"center",maxWidth:640}}>
                  <div style={{width:60,height:60,borderRadius:"50%",background:C.purpleBg,border:`2px solid ${C.purpleBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 20px"}}>⚡</div>
                  <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>AI가 영상을 분석하는 중...</div>
                  <div style={{fontSize:13,color:C.gray400,marginBottom:24}}>영상 구성 분석 → 내 스타일로 각색 → 스크립트 생성</div>
                  <div style={{height:6,background:C.gray100,borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",background:`linear-gradient(90deg,${C.purpleLight},${C.purpleDark})`,borderRadius:99,animation:"progress 2s infinite",width:"60%"}}/>
                  </div>
                  <style>{`@keyframes progress{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
                </div>
              )}

              {/* STEP 3: 스크립트 편집 */}
              {makeStep===3 && analysisResult && (
                <div>
                  {/* 분석 결과 */}
                  <div style={{background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",gap:12,alignItems:"flex-start"}}>
                    <span style={{fontSize:18,flexShrink:0}}>🔍</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:C.purple,marginBottom:4}}>원본 영상 분석</div>
                      <div style={{fontSize:13,color:C.gray700,lineHeight:1.7}}>{analysisResult.analysis}</div>
                  {analysisResult.product_placement && (
                    <div style={{marginTop:8,padding:"8px 12px",background:C.purpleBg,borderRadius:8,fontSize:12,color:C.purple}}>
                      💎 제품 등장: {analysisResult.product_placement}
                    </div>
                  )}
                    </div>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                    {/* 편집 영역 */}
                    <div>
                      <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20,marginBottom:14}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.purple,marginBottom:10}}>🎯 훅 — 첫 3초</div>
                        <div style={{padding:"12px 14px",background:C.purpleBg,borderRadius:9,fontSize:15,fontWeight:700,color:C.gray900,lineHeight:1.6}}>
                          {analysisResult.hook}
                        </div>
                      </div>
                      <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20,marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <span style={{fontSize:13,fontWeight:700}}>📝 스크립트</span>
                          <span style={{fontSize:11,color:C.gray400}}>자유롭게 수정하세요</span>
                        </div>
                        <textarea value={editScript} onChange={e=>setEditScript(e.target.value)}
                          style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:9,padding:"12px",fontSize:13,lineHeight:1.8,minHeight:140,resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
                      </div>
                      <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                        <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>🏷️ 캡션 & 해시태그</div>
                        <textarea value={editCaption} onChange={e=>setEditCaption(e.target.value)}
                          style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:9,padding:"10px 12px",fontSize:13,minHeight:56,resize:"none",outline:"none",boxSizing:"border-box",marginBottom:8}}
                          placeholder="캡션..."/>
                        <textarea value={editHashtags} onChange={e=>setEditHashtags(e.target.value)}
                          style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:9,padding:"10px 12px",fontSize:12,minHeight:40,resize:"none",outline:"none",boxSizing:"border-box",color:C.purple}}
                          placeholder="#kbeauty #밀리밀리..."/>
                      </div>
                    </div>

                    {/* 미리보기 + 생성 버튼 */}
                    <div>
                      <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
                        <div style={{width:200,height:356,background:"#0a0a0a",borderRadius:22,position:"relative",overflow:"hidden",border:"4px solid #1a1a1a"}}>
                          {bgPhoto && <img src={bgPhoto} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:.5}} alt="bg"/>}
                          <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,rgba(26,8,32,.7),rgba(10,16,32,.7))"}}/>
                          {facePhoto && <img src={facePhoto} style={{position:"absolute",top:40,left:"50%",transform:"translateX(-50%)",width:80,height:80,borderRadius:"50%",objectFit:"cover",border:"3px solid rgba(255,255,255,.5)"}} alt="face"/>}
                          <div style={{position:"absolute",bottom:56,left:0,right:0,padding:"0 12px"}}>
                            <div style={{background:"rgba(0,0,0,.75)",borderRadius:8,padding:"8px 10px",fontSize:10,color:"#fff",lineHeight:1.6,textAlign:"center"}}>
                              {editCaption||analysisResult.hook}
                            </div>
                          </div>
                          <div style={{position:"absolute",bottom:16,left:0,right:0,textAlign:"center",fontSize:10,color:"rgba(255,255,255,.6)"}}>@{charName}</div>
                      {productPhoto && <img src={productPhoto} style={{position:"absolute",bottom:40,right:10,width:60,height:60,objectFit:"contain",borderRadius:8,background:"rgba(255,255,255,.15)",padding:4}} alt="product"/>}
                        </div>
                      </div>
                      {heygenError && <div style={{marginBottom:12,padding:"10px 14px",background:C.redBg,borderRadius:9,fontSize:12,color:C.red}}>⚠ {heygenError}</div>}
                      <button onClick={generateVideo} style={{width:"100%",padding:"14px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:10}}>
                        🎬 이 스크립트로 영상 생성
                      </button>
                      <button onClick={()=>setMakeStep(1)} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${C.gray200}`,background:C.white,fontSize:13,color:C.gray500,cursor:"pointer"}}>
                        ← 다른 링크로 다시
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: 생성 중 */}
              {makeStep===4 && (
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:16,padding:"60px 40px",textAlign:"center",maxWidth:640}}>
                  <div style={{width:60,height:60,borderRadius:"50%",background:"#FFF0F5",border:"2px solid #F9A8D4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 20px"}}>🎬</div>
                  <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>영상을 만드는 중...</div>
                  <div style={{fontSize:13,color:C.gray400,marginBottom:24}}>HeyGen이 아바타 영상을 렌더링하고 있어요 (1~3분 소요)</div>
                  <div style={{height:8,background:C.gray100,borderRadius:99,overflow:"hidden",marginBottom:10}}>
                    <div style={{height:"100%",background:`linear-gradient(90deg,#F9A8D4,#C4267D)`,borderRadius:99,width:`${heygenProgress}%`,transition:"width .5s"}}/>
                  </div>
                  <div style={{fontSize:12,color:C.gray400}}>{heygenProgress}%</div>
                </div>
              )}

              {/* STEP 5: 완료 */}
              {makeStep===5 && heygenResult && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                  <div>
                    <div style={{background:C.greenBg,border:`1px solid #6EE7B7`,borderRadius:12,padding:20,marginBottom:16}}>
                      <div style={{fontSize:16,fontWeight:700,color:C.green,marginBottom:4}}>🎉 영상 완성!</div>
                      <div style={{fontSize:13,color:C.gray700}}>스크립트 편집 내용이 반영된 영상이에요</div>
                    </div>
                    {heygenResult.thumbnailUrl && (
                      <div style={{marginBottom:16}}>
                        <img src={heygenResult.thumbnailUrl} style={{width:"100%",borderRadius:12}} alt="thumbnail"/>
                      </div>
                    )}
                    <div style={{display:"flex",gap:8,marginBottom:10}}>
                      {heygenResult.videoUrl && (
                        <a href={heygenResult.videoUrl} target="_blank" rel="noreferrer"
                          style={{flex:1,padding:"11px",borderRadius:9,border:`1px solid ${C.gray200}`,background:C.white,fontSize:13,color:C.gray700,textDecoration:"none",textAlign:"center",display:"block"}}>
                          ⬇ 다운로드
                        </a>
                      )}
                      <button onClick={()=>setTab("schedule")} style={{flex:1,padding:"11px",borderRadius:9,border:"none",background:C.purple,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                        📅 예약하기
                      </button>
                    </div>
                    <button onClick={uploadToTikTok} disabled={tiktokUploading||!tiktokToken}
                      style={{width:"100%",padding:"12px",borderRadius:9,border:"none",background:"#010101",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",opacity:tiktokUploading?0.6:1}}>
                      {tiktokUploading?"⏳ TikTok 업로드 중...":"▶ TikTok에 바로 올리기"}
                    </button>
                    {!tiktokToken && <div style={{textAlign:"center",fontSize:11,color:C.gray400,marginTop:6}}>TikTok 연결 후 업로드 가능</div>}
                    {tiktokUploadResult && <div style={{marginTop:8,padding:"10px",background:C.greenBg,borderRadius:8,fontSize:13,color:C.green,textAlign:"center",fontWeight:600}}>{tiktokUploadResult.status}</div>}
                    {tiktokUploadError && <div style={{marginTop:8,padding:"10px",background:C.redBg,borderRadius:8,fontSize:12,color:C.red}}>⚠ {tiktokUploadError}</div>}
                    <button onClick={()=>{setMakeStep(1);setRefVideoUrl("");setAnalysisResult(null);setHeygenResult(null);}} style={{width:"100%",padding:"10px",borderRadius:9,border:`1px solid ${C.gray200}`,background:C.white,fontSize:13,color:C.gray500,cursor:"pointer",marginTop:10}}>
                      + 새 영상 만들기
                    </button>
                  </div>
                  <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>최종 콘텐츠</div>
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:11,color:C.gray400,marginBottom:4}}>스크립트</div>
                      <div style={{fontSize:13,color:C.gray700,lineHeight:1.8,padding:"10px 12px",background:C.gray50,borderRadius:9}}>{editScript}</div>
                    </div>
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:11,color:C.gray400,marginBottom:4}}>캡션</div>
                      <div style={{fontSize:13,color:C.gray700,lineHeight:1.7,padding:"10px 12px",background:C.gray50,borderRadius:9}}>{editCaption}</div>
                    </div>
                    <div>
                      <div style={{fontSize:11,color:C.gray400,marginBottom:4}}>해시태그</div>
                      <div style={{fontSize:12,color:C.purple,padding:"10px 12px",background:C.purpleBg,borderRadius:9}}>{editHashtags}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ 예약 ══ */}
          {tab==="schedule" && (
            <div>
              {schedOk&&<div style={{padding:"12px 16px",background:C.greenBg,borderRadius:9,marginBottom:16,fontSize:13,color:C.green}}>✓ 예약 완료! {newDate} {newTime} {FLAG[newCountry]}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <span style={{fontWeight:700,fontSize:15}}>{calYear}년 {calMonth+1}월</span>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${C.gray200}`,background:C.white,cursor:"pointer"}}>‹</button>
                      <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${C.gray200}`,background:C.white,cursor:"pointer"}}>›</button>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
                    {["일","월","화","수","목","금","토"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:C.gray400,padding:"3px 0"}}>{d}</div>)}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                    {Array.from({length:calDays().first}).map((_,i)=><div key={"e"+i}/>)}
                    {Array.from({length:calDays().total}).map((_,i)=>{
                      const day=i+1,dp=postsOnDay(day),today=new Date().getDate()===day&&new Date().getMonth()===calMonth&&new Date().getFullYear()===calYear;
                      return <div key={day} style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",padding:"2px 0",borderRadius:6,background:today?C.purple:"transparent"}}>
                        <div style={{fontSize:12,color:today?"#fff":C.gray700}}>{day}</div>
                        {dp.length>0&&<div style={{width:5,height:5,borderRadius:"50%",background:STATUS_C[dp[0].status],marginTop:1}}/>}
                      </div>;
                    })}
                  </div>
                </div>
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:18}}>새 예약 추가</div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:12,color:C.gray500,marginBottom:6}}>날짜</div>
                    <input type="date" style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}} value={newDate} onChange={e=>setNewDate(e.target.value)}/>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:12,color:C.gray500,marginBottom:6}}>시간</div>
                    <input type="time" style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}} value={newTime} onChange={e=>setNewTime(e.target.value)}/>
                  </div>
                  <div style={{marginBottom:18}}>
                    <div style={{fontSize:12,color:C.gray500,marginBottom:8}}>타겟 국가</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {Object.keys(FLAG).map(c=>(
                        <button key={c} onClick={()=>setNewCountry(c)} style={{padding:"5px 8px",borderRadius:6,border:`1.5px solid ${newCountry===c?C.purple:C.gray200}`,background:newCountry===c?C.purpleBg:C.white,fontSize:15,cursor:"pointer"}}>{FLAG[c]}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={()=>{if(!newDate)return;setPosts(p=>[...p,{id:Date.now(),title:editCaption?.slice(0,40)||"새 콘텐츠",date:newDate,time:newTime,country:newCountry,status:"scheduled",thumb:"📅"}]);setSchedOk(true);setTimeout(()=>setSchedOk(false),3000);}} disabled={!newDate}
                    style={{width:"100%",padding:"11px",borderRadius:8,border:"none",background:newDate?C.purple:C.gray200,color:newDate?"#fff":C.gray400,fontSize:14,fontWeight:600,cursor:"pointer"}}>
                    예약 확정
                  </button>
                </div>
              </div>
              <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>예약 현황</div>
                {posts.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(p=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.gray100}`}}>
                    <div style={{width:40,height:40,borderRadius:9,background:C.gray100,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{p.thumb}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
                      <div style={{fontSize:11,color:C.gray400,marginTop:2}}>{p.date} {p.time} · {FLAG[p.country]}</div>
                    </div>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:500,background:p.status==="published"?C.greenBg:p.status==="scheduled"?C.purpleBg:C.gray100,color:STATUS_C[p.status]}}>{STATUS_L[p.status]}</span>
                    {p.status==="scheduled"&&<button onClick={()=>setPosts(prev=>prev.filter(x=>x.id!==p.id))} style={{padding:"5px 10px",borderRadius:6,border:`1px solid #FCA5A5`,background:C.redBg,color:C.red,fontSize:11,cursor:"pointer"}}>취소</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ 관리 ══ */}
          {tab==="manage" && (
            <div>
              <div style={{display:"flex",gap:6,marginBottom:16}}>
                {["all","scheduled","published","draft"].map(f=>(
                  <button key={f} onClick={()=>setMgmtFilter(f)} style={{padding:"7px 16px",borderRadius:20,border:`1px solid ${mgmtFilter===f?C.purple:C.gray200}`,background:mgmtFilter===f?C.purpleBg:C.white,color:mgmtFilter===f?C.purple:C.gray500,fontSize:13,cursor:"pointer"}}>
                    {f==="all"?"전체":STATUS_L[f]} <span style={{fontWeight:600}}>{f==="all"?posts.length:posts.filter(p=>p.status===f).length}</span>
                  </button>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {posts.filter(p=>mgmtFilter==="all"||p.status===mgmtFilter).map(p=>(
                  <div key={p.id} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:18}}>
                    {editingId===p.id?(
                      <div>
                        <input style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10}} defaultValue={p.title} onBlur={e=>setPosts(prev=>prev.map(x=>x.id===p.id?{...x,title:e.target.value}:x))}/>
                        <div style={{display:"flex",gap:8}}>
                          <input type="date" style={{flex:1,border:`1px solid ${C.gray200}`,borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none"}} defaultValue={p.date} onBlur={e=>setPosts(prev=>prev.map(x=>x.id===p.id?{...x,date:e.target.value}:x))}/>
                          <button onClick={()=>setEditingId(null)} style={{padding:"9px 16px",borderRadius:8,border:"none",background:C.purple,color:"#fff",fontSize:13,cursor:"pointer"}}>저장</button>
                        </div>
                      </div>
                    ):(
                      <div style={{display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:44,height:44,borderRadius:10,background:C.gray100,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{p.thumb}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{p.title}</div>
                          <div style={{fontSize:11,color:C.gray400}}>{p.date} · {FLAG[p.country]}</div>
                        </div>
                        <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:500,background:p.status==="published"?C.greenBg:p.status==="scheduled"?C.purpleBg:C.gray100,color:STATUS_C[p.status]}}>{STATUS_L[p.status]}</span>
                        <div style={{display:"flex",gap:6}}>
                          {p.status!=="published"&&<button onClick={()=>setEditingId(p.id)} style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${C.gray200}`,background:C.white,fontSize:12,cursor:"pointer"}}>편집</button>}
                          {p.status==="draft"&&<button onClick={()=>setPosts(prev=>prev.map(x=>x.id===p.id?{...x,status:"scheduled"}:x))} style={{padding:"6px 12px",borderRadius:6,border:"none",background:C.purple,color:"#fff",fontSize:12,cursor:"pointer"}}>예약</button>}
                          <button onClick={()=>setPosts(prev=>prev.filter(x=>x.id!==p.id))} style={{padding:"6px 12px",borderRadius:6,border:`1px solid #FCA5A5`,background:C.redBg,color:C.red,fontSize:12,cursor:"pointer"}}>삭제</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ 성과 ══ */}
          {tab==="perf" && (
            <div>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}>
                <div style={{display:"flex",gap:3,background:C.gray100,padding:3,borderRadius:9}}>
                  {[["7d","7일"],["30d","30일"],["90d","90일"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setPeriod(v)} style={{padding:"6px 16px",borderRadius:7,fontSize:12,background:period===v?C.white:"transparent",color:period===v?C.gray900:C.gray400,border:"none",cursor:"pointer",fontWeight:period===v?600:400}}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
                {[["👁","조회수",PERF_DATA[period].views],["♥","좋아요",PERF_DATA[period].likes],["💬","댓글",PERF_DATA[period].comments],["✦","팔로워",PERF_DATA[period].followers]].map(([icon,label,val],i)=>(
                  <div key={i} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20,textAlign:"center"}}>
                    <div style={{fontSize:24,marginBottom:8}}>{icon}</div>
                    <div style={{fontSize:24,fontWeight:800}}>{val}</div>
                    <div style={{fontSize:12,color:C.gray400,marginTop:4}}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>TOP 콘텐츠</div>
                  {posts.map((p,i)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<posts.length-1?`1px solid ${C.gray100}`:"none"}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.gray200,width:20}}>#{i+1}</div>
                      <div style={{width:34,height:34,borderRadius:8,background:C.gray100,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{p.thumb}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
                        <div style={{fontSize:11,color:C.gray400}}>{FLAG[p.country]} {p.date}</div>
                      </div>
                      {i===0&&<span style={{padding:"2px 8px",borderRadius:20,background:C.amberBg,color:C.amber,fontSize:11}}>🔥 Best</span>}
                    </div>
                  ))}
                </div>
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>AI 인사이트</div>
                  {[{q:"가장 반응 좋은 유형은?",a:"전후 변신 스타일 — 참여율 2.3배"},{q:"최적 게시 시간은?",a:"오전 8-9시 & 저녁 9-10시"},{q:"성장 포인트는?",a:`팔로워 ${PERF_DATA[period].followers} · 글로벌 도달 32% 상승`}].map((ins,i)=>(
                    <div key={i} style={{padding:"12px 0",borderBottom:i<2?`1px solid ${C.gray100}`:"none"}}>
                      <div style={{fontSize:11,color:C.gray400,marginBottom:4}}>Q. {ins.q}</div>
                      <div style={{fontSize:13,color:C.gray700,lineHeight:1.6}}>{ins.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ 댓글 ══ */}
          {tab==="comments" && (
            <div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:20}}>
                <span style={{padding:"4px 12px",borderRadius:20,background:"#FFF0F5",color:"#C4267D",fontSize:12,fontWeight:500}}>💰 {comments.filter(c=>c.type==="sales"&&c.status==="pending").length} 판매문의</span>
                <span style={{padding:"4px 12px",borderRadius:20,background:C.amberBg,color:C.amber,fontSize:12,fontWeight:500}}>⏳ {comments.filter(c=>c.status==="pending").length} 미답변</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>자동화 설정</div>
                  {[{key:"simple",label:"단순 댓글 AI 자동 답글",sub:"AI가 즉시 처리"},{key:"negative",label:"악성 댓글 자동 숨기기",sub:"브랜드 보호"},{key:"sales",label:"판매 문의 즉시 알림",sub:"골든타임"}].map((s,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:i<2?`1px solid ${C.gray100}`:"none"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500}}>{s.label}</div>
                        <div style={{fontSize:11,color:C.gray400,marginTop:2}}>{s.sub}</div>
                      </div>
                      <button onClick={()=>setAuto(p=>({...p,[s.key]:!p[s.key]}))} style={{width:42,height:23,borderRadius:12,background:auto[s.key]?C.purple:C.gray200,position:"relative",cursor:"pointer",border:"none"}}>
                        <div style={{width:17,height:17,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:auto[s.key]?22:3,transition:"left .2s"}}/>
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>이번 주 현황</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                    {[["전체",comments.length,C.gray900],["판매",comments.filter(c=>c.type==="sales").length,"#C4267D"],["자동처리",comments.filter(c=>c.status==="auto_replied").length,C.green],["완료",comments.filter(c=>c.replied).length,C.purple]].map(([l,v,c],i)=>(
                      <div key={i} style={{background:C.gray50,borderRadius:10,padding:"13px 16px"}}>
                        <div style={{fontSize:11,color:C.gray400,marginBottom:3}}>{l}</div>
                        <div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:12,color:C.gray400,marginBottom:8}}>빠른 답글 템플릿</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {templates.map(t=><button key={t.id} onClick={()=>setReplyText(t.text)} style={{padding:"5px 11px",borderRadius:6,border:`1px solid ${C.gray200}`,background:C.white,fontSize:11,color:C.gray700,cursor:"pointer"}}>{t.label}</button>)}
                  </div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>댓글 목록</div>
                  {comments.map(c=>(
                    <div key={c.id} onClick={()=>setSelectedComment(c)} style={{padding:"12px 0",borderBottom:`1px solid ${C.gray100}`,cursor:"pointer",background:selectedComment?.id===c.id?C.gray50:"transparent",margin:"0 -4px",padding:"12px 4px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                            <span style={{fontSize:12,fontWeight:600}}>{c.user}</span>
                            <span style={{padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:500,background:c.type==="sales"?"#FFF0F5":c.type==="negative"?C.amberBg:C.greenBg,color:c.type==="sales"?"#C4267D":c.type==="negative"?C.amber:C.green}}>
                              {c.type==="sales"?"💰 판매":c.type==="negative"?"⚠ 부정":"👍 긍정"}
                            </span>
                          </div>
                          <div style={{fontSize:13,color:C.gray500,lineHeight:1.5}}>{c.text}</div>
                        </div>
                        {c.replied&&<div style={{color:C.green,fontSize:11,flexShrink:0}}>✓</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>{selectedComment?"@"+selectedComment.user+" 답글":"댓글을 선택하세요"}</div>
                  {selectedComment?(
                    <div>
                      <div style={{padding:"10px 12px",background:C.gray50,borderRadius:9,fontSize:13,color:C.gray500,marginBottom:14,lineHeight:1.6}}>{selectedComment.text}</div>
                      <textarea style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"10px 12px",fontSize:13,minHeight:80,resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}} value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="답글 입력..."/>
                      <button onClick={genAiReply} disabled={aiReplying} style={{width:"100%",padding:"9px",borderRadius:7,border:`1px solid ${C.purpleBorder}`,background:C.purpleBg,color:C.purple,fontSize:12,cursor:"pointer",marginBottom:8}}>{aiReplying?"생성 중...":"✦ AI 답글 생성"}</button>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>{setComments(prev=>prev.map(x=>x.id===selectedComment.id?{...x,replied:true}:x));setReplyText("");setSelectedComment(null);}} style={{flex:1,padding:"9px",borderRadius:7,border:"none",background:C.purple,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>답글 달기</button>
                        <button onClick={()=>setComments(prev=>prev.map(x=>x.id===selectedComment.id?{...x,status:"hidden"}:x))} style={{padding:"9px 14px",borderRadius:7,border:`1px solid ${C.gray200}`,background:C.white,fontSize:12,cursor:"pointer"}}>숨기기</button>
                      </div>
                    </div>
                  ):(
                    <div style={{textAlign:"center",padding:"40px 0"}}>
                      <div style={{fontSize:32,marginBottom:10}}>💬</div>
                      <div style={{fontSize:13,color:C.gray400}}>왼쪽에서 댓글을 선택하세요</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
