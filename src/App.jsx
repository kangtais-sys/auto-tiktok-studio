import { useState, useRef, useEffect } from "react";

// ── API ──────────────────────────────────────────────────────────
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const callClaude = async (msgs, system = "") => {
  const body = { model: MODEL, max_tokens: 1200, messages: msgs };
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
const extractText = (data) =>
  (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");

// ── CONSTANTS ────────────────────────────────────────────────────
const FLAG = { KR:"🇰🇷",US:"🇺🇸",JP:"🇯🇵",TH:"🇹🇭",ID:"🇮🇩",VN:"🇻🇳",BR:"🇧🇷",MY:"🇲🇾",SA:"🇸🇦",TW:"🇹🇼",FR:"🇫🇷",MX:"🇲🇽" };
const NAV = [
  { id:"style",   icon:"✦", label:"AI 스타일" },
  { id:"create",  icon:"⚡", label:"콘텐츠 생성" },
  { id:"video",   icon:"🎬", label:"영상 제작" },
  { id:"schedule",icon:"📅", label:"콘텐츠 예약" },
  { id:"manage",  icon:"📋", label:"콘텐츠 관리" },
  { id:"perf",    icon:"📊", label:"성과 분석" },
  { id:"comments",icon:"💬", label:"댓글 관리" },
];
const PRESETS = [
  {id:"kbeauty",label:"K-뷰티 글로우",icon:"✨",vibe:"청순·맑은 피부",speech:"친근한 언니",concept:"K뷰티 글로우",age:"24",lang:"한국어"},
  {id:"luxury",label:"럭셔리 스킨",icon:"💎",vibe:"고급스럽고 세련",speech:"차분하고 전문적",concept:"프리미엄 스킨케어",age:"28",lang:"한국어/영어"},
  {id:"viral",label:"바이럴 퀸",icon:"🔥",vibe:"강렬·임팩트",speech:"빠르고 강렬하게",concept:"3초 훅 특화",age:"22",lang:"한국어"},
  {id:"calm",label:"젠 뷰티",icon:"🌿",vibe:"자연·미니멀",speech:"차분하고 신뢰감",concept:"클린뷰티",age:"26",lang:"한국어"},
  {id:"funny",label:"코믹 뷰티",icon:"😂",vibe:"유머·발랄",speech:"웃기고 공감",concept:"리얼 뷰티",age:"23",lang:"한국어"},
  {id:"global",label:"글로벌 뷰티",icon:"🌍",vibe:"세련·글로벌",speech:"영어+한국어 믹스",concept:"K뷰티 해외 수출",age:"25",lang:"영어/한국어"},
];
const PERF_DATA = {
  "7d": {views:"284K",likes:"18.2K",comments:"2,140",followers:"+892",top:"전후 변신"},
  "30d":{views:"1.2M",likes:"74K",comments:"8,900",followers:"+3.4K",top:"성분 설명"},
  "90d":{views:"3.8M",likes:"230K",comments:"27K",followers:"+11K",top:"루틴 소개"},
};
const STATUS_L = {published:"게시됨",scheduled:"예약됨",draft:"초안",failed:"실패"};
const STATUS_C = {published:"#059669",scheduled:"#8435F3",draft:"#9CA3AF",failed:"#E11D48"};
const VFX_PRESETS = [
  {id:"glow",icon:"✨",label:"글로우 스킨"},{id:"ba",icon:"↔",label:"전후 변환"},
  {id:"float",icon:"💫",label:"제품 플로팅"},{id:"matrix",icon:"🟩",label:"매트릭스"},
];
const HEYGEN_AVATARS = [
  {id:"aria",name:"Aria",thumb:"👩",style:"K뷰티"},
  {id:"mia",name:"Mia",thumb:"👱‍♀️",style:"글로벌 럭셔리"},
  {id:"yuki",name:"Yuki",thumb:"👩‍🦱",style:"일본 미소녀"},
];
const INIT_POSTS = [
  {id:1,title:"유리피부 루틴 공개 ✨",date:"2026-03-28",time:"09:00",country:"KR",status:"published",thumb:"✨"},
  {id:2,title:"MILLIMILLI 신제품 리뷰",date:"2026-03-30",time:"20:00",country:"JP",status:"scheduled",thumb:"💎"},
  {id:3,title:"#kbeauty 500달톤 비밀",date:"2026-04-01",time:"19:30",country:"US",status:"scheduled",thumb:"🔬"},
  {id:4,title:"나이트 스킨케어 루틴",date:"2026-04-03",time:"21:00",country:"TH",status:"draft",thumb:"🌙"},
];
const INIT_COMMENTS = [
  {id:1,user:"@beauty_lover_th",text:"OMG this product is amazing! Where can I buy it?",type:"sales",status:"pending",replied:false,post:"유리피부 루틴"},
  {id:2,user:"@skincare_jp",text:"너무 예뻐요! 제품 구매 링크 알려주세요",type:"sales",status:"pending",replied:false,post:"MILLIMILLI 신제품"},
  {id:3,user:"@kbeauty_fan",text:"이 루틴 진짜 최고야! 팔로우 완료 💕",type:"positive",status:"auto_replied",replied:true,post:"유리피부 루틴"},
  {id:4,user:"@troll123",text:"광고인 거 티 나잖아요",type:"negative",status:"hidden",replied:false,post:"신제품 리뷰"},
];
const INIT_TEMPLATES = [
  {id:1,label:"감사 KR",text:"감사해요 💕 @millimilli_official 에서 더 확인해보세요!"},
  {id:2,label:"감사 EN",text:"Thank you so much! 💕 Check @millimilli_official for more!"},
  {id:3,label:"쇼핑 KR",text:"구매는 bio 링크에서! 지금 한정 할인 중 🎁"},
  {id:4,label:"부정 대응",text:"소중한 의견 감사해요. DM으로 이야기 나눠요 😊"},
];

// ── MAIN ─────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("style");

  // TikTok
  const [tiktokToken, setTiktokToken] = useState(localStorage.getItem("tt_token")||"");
  const [tiktokUser, setTiktokUser] = useState(localStorage.getItem("tt_user")||"");
  const [tiktokUploading, setTiktokUploading] = useState(false);
  const [tiktokUploadResult, setTiktokUploadResult] = useState(null);
  const [tiktokUploadError, setTiktokUploadError] = useState("");

  // Style tab
  const [persona, setPersona] = useState({name:"MILLI",age:"24",lang:"한국어",vibe:"청순·글로우",speech:"친근한 언니",concept:"K뷰티 글로우"});
  const [personaSaved, setPersonaSaved] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([{role:"ai",text:"안녕하세요! 어떤 버추얼 인플루언서를 만들고 싶으세요? 예: '20대 K뷰티 언니, 발랄하고 친근하게'"}]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [refUrl, setRefUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [refAnalysis, setRefAnalysis] = useState(null);
  const chatRef = useRef(null);
  useEffect(() => { chatRef.current?.scrollTo(0,9999); }, [chatMsgs]);

  // Content
  const [step, setStep] = useState(1);
  const [srcUrl, setSrcUrl] = useState("");
  const [gen, setGen] = useState(null);
  const [caption, setCaption] = useState("");

  // Video
  const [selectedAvatar, setSelectedAvatar] = useState("aria");
  const [heygenScript, setHeygenScript] = useState("");
  const [heygenGenerating, setHeygenGenerating] = useState(false);
  const [heygenResult, setHeygenResult] = useState(null);
  const [heygenError, setHeygenError] = useState("");
  const [heygenProgress, setHeygenProgress] = useState("");
  const [higgsfieldMode, setHiggsfieldMode] = useState("product");
  const [selectedVFX, setSelectedVFX] = useState("glow");
  const [productUrl, setProductUrl] = useState("");
  const [higgsfieldGenerating, setHiggsfieldGenerating] = useState(false);
  const [higgsfieldResult, setHiggsfieldResult] = useState(null);

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

  // TikTok OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code) return;
    if (state !== sessionStorage.getItem("tt_state")) return;
    const CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
    const CLIENT_SECRET = import.meta.env.VITE_TIKTOK_CLIENT_SECRET;
    const codeVerifier = sessionStorage.getItem("tt_code_verifier");
    fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body: new URLSearchParams({client_key:CLIENT_KEY,client_secret:CLIENT_SECRET,code,grant_type:"authorization_code",redirect_uri:window.location.origin+"/tiktok-callback",code_verifier:codeVerifier})
    }).then(r=>r.json()).then(data=>{
      if (data.access_token) {
        localStorage.setItem("tt_token",data.access_token); setTiktokToken(data.access_token);
        fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",{headers:{"Authorization":"Bearer "+data.access_token}})
          .then(r=>r.json()).then(u=>{ const n=u?.data?.user?.display_name||""; localStorage.setItem("tt_user",n); setTiktokUser(n); });
        window.history.replaceState({},"","/");
      }
    });
  }, []);

  const loginTikTok = async () => {
    const CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
    const redirectUri = encodeURIComponent(window.location.origin+"/tiktok-callback");
    const scope = encodeURIComponent("user.info.basic,video.upload,video.list");
    const state = Math.random().toString(36).slice(2);
    const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
    const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    sessionStorage.setItem("tt_state",state); sessionStorage.setItem("tt_code_verifier",codeVerifier);
    window.location.href=`https://www.tiktok.com/v2/auth/authorize?client_key=${CLIENT_KEY}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  };
  const logoutTikTok = () => { localStorage.removeItem("tt_token"); localStorage.removeItem("tt_user"); setTiktokToken(""); setTiktokUser(""); };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput; setChatInput(""); setChatLoading(true);
    setChatMsgs(p=>[...p,{role:"user",text:msg}]);
    try {
      const data = await callClaude(
        [{role:"user",content:msg}],
        `당신은 K뷰티 버추얼 인플루언서 캐릭터 디자이너입니다. 사용자의 요청을 분석해서 캐릭터를 제안하세요.
반드시 아래 JSON 블록을 포함한 짧은 응답을 하세요:
\`\`\`json
{"name":"캐릭터이름","age":"나이","lang":"주요언어","vibe":"분위기/무드","speech":"말투스타일","concept":"컨셉한줄설명"}
\`\`\`
JSON 앞뒤로 1-2줄 짧은 코멘트만 추가하세요. 길게 쓰지 마세요.`
      );
      const reply = extractText(data);
      const jsonMatch = reply.match(/```json\n?([\s\S]*?)\n?```/);
      let suggestion = null;
      if (jsonMatch) {
        try { suggestion = JSON.parse(jsonMatch[1]); } catch {}
      }
      const cleanText = reply.replace(/```json[\s\S]*?```/g, "").trim();
      setChatMsgs(p=>[...p,{role:"ai",text:cleanText,suggestion}]);
    } catch { setChatMsgs(p=>[...p,{role:"ai",text:"오류가 발생했어요. 다시 시도해주세요."}]); }
    setChatLoading(false);
  };

  const analyzeRef = async () => {
    if (!refUrl.trim()) return;
    setAnalyzing(true); setRefAnalysis(null);
    try {
      const handle = refUrl.replace("https://www.tiktok.com/@","").replace("@","").split("/")[0] || refUrl;
      const data = await callClaude(
        [{role:"user",content:`TikTok 계정 @${handle} 을 분석해주세요`}],
        `K뷰티 TikTok 계정 스타일 분석가입니다. 계정명을 보고 해당 계정의 예상 스타일을 분석하고 유사 스타일 3가지를 추천하세요.
반드시 아래 JSON만 응답하세요:
{"account":"@${handle}","summary":"계정 스타일 한줄 요약","suggestions":[{"label":"스타일명","desc":"설명","persona":{"name":"이름","vibe":"무드","speech":"말투","concept":"컨셉"}},{"label":"스타일명2","desc":"설명2","persona":{"name":"이름2","vibe":"무드2","speech":"말투2","concept":"컨셉2"}},{"label":"스타일명3","desc":"설명3","persona":{"name":"이름3","vibe":"무드3","speech":"말투3","concept":"컨셉3"}}]}`
      );
      const txt = extractText(data).replace(/```json|```/g,"").trim();
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) setRefAnalysis(JSON.parse(m[0]));
    } catch {}
    setAnalyzing(false);
  };

  const generateContent = async () => {
    setStep(2);
    try {
      const data = await callClaude([{role:"user",content:`K뷰티 TikTok 콘텐츠. URL: ${srcUrl}. 캐릭터: ${persona.concept}, 말투: ${persona.speech}. JSON만: {"hook":"","script":"","captions":["","",""],"hashtags":["","","","","","","",""],"duration":30,"cta":""}`}]);
      const txt = extractText(data).replace(/```json|```/g,"").trim();
      const m = txt.match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : null;
      if (parsed) { setGen(parsed); setCaption(parsed.captions?.[0]||""); setStep(3); } else setStep(1);
    } catch { setStep(1); }
  };

  const simulateHeygen = async () => {
    if (!heygenScript.trim()) return;
    setHeygenGenerating(true); setHeygenResult(null); setHeygenError(""); setHeygenProgress("영상 생성 요청 중...");
    const HEYGEN_KEY = import.meta.env.VITE_HEYGEN_API_KEY;
    try {
      const res = await fetch("/heygen/v2/video/generate",{method:"POST",headers:{"X-Api-Key":HEYGEN_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({video_inputs:[{character:{type:"avatar",avatar_id:"Abigail_expressive_2024112501",avatar_style:"normal"},voice:{type:"text",input_text:heygenScript,voice_id:"1bd001e7e50f421d891986aad5158bc8"}}],dimension:{width:720,height:1280}})});
      const data = await res.json();
      if (data.error) throw new Error(data.error.message||"생성 실패");
      const videoId = data.data?.video_id;
      if (!videoId) throw new Error("video_id 없음");
      setHeygenProgress("렌더링 중...");
      let attempts = 0;
      while (attempts < 36) {
        await new Promise(r=>setTimeout(r,5000));
        const sr = await fetch("/heygen/v1/video_status.get?video_id="+videoId,{headers:{"X-Api-Key":HEYGEN_KEY}});
        const sd = await sr.json();
        setHeygenProgress(`렌더링 중... ${Math.min(attempts*8,90)}%`);
        if (sd.data?.status==="completed") { setHeygenResult({videoUrl:sd.data?.video_url,thumbnailUrl:sd.data?.thumbnail_url}); setHeygenProgress(""); setHeygenGenerating(false); return; }
        else if (sd.data?.status==="failed") throw new Error("영상 생성 실패");
        attempts++;
      }
      throw new Error("시간 초과");
    } catch(e) { setHeygenError(e.message); setHeygenProgress(""); setHeygenGenerating(false); }
  };

  const uploadToTikTok = async (videoUrl, cap) => {
    if (!tiktokToken) { alert("TikTok 로그인이 필요해요!"); return; }
    setTiktokUploading(true); setTiktokUploadError(""); setTiktokUploadResult(null);
    try {
      const initRes = await fetch("/tiktok/v2/post/publish/video/init/",{method:"POST",headers:{"Authorization":"Bearer "+tiktokToken,"Content-Type":"application/json; charset=UTF-8"},
        body:JSON.stringify({post_info:{title:cap||"✨ K-Beauty #kbeauty #millimilli",privacy_level:"SELF_ONLY",disable_duet:false,disable_comment:false,disable_stitch:false},source_info:{source:"PULL_FROM_URL",video_url:videoUrl}})});
      const initData = await initRes.json();
      if (initData.error?.code && initData.error.code!=="ok") throw new Error(initData.error.message);
      const publishId = initData.data?.publish_id;
      if (!publishId) throw new Error("publish_id 없음");
      let attempts = 0;
      while (attempts<20) {
        await new Promise(r=>setTimeout(r,3000));
        const sr = await fetch("/tiktok/v2/post/publish/status/fetch/",{method:"POST",headers:{"Authorization":"Bearer "+tiktokToken,"Content-Type":"application/json; charset=UTF-8"},body:JSON.stringify({publish_id:publishId})});
        const sd = await sr.json();
        if (sd.data?.status==="PUBLISH_COMPLETE") { setTiktokUploadResult({status:"✅ TikTok 업로드 완료!"}); setTiktokUploading(false); return; }
        else if (sd.data?.status==="FAILED") throw new Error("업로드 실패");
        attempts++;
      }
      throw new Error("시간 초과");
    } catch(e) { setTiktokUploadError(e.message); setTiktokUploading(false); }
  };

  const genAiReply = async () => {
    if (!selectedComment) return; setAiReplying(true);
    try { const data = await callClaude([{role:"user",content:`K뷰티 인플루언서 댓글 답글: "${selectedComment.text}". 짧게 이모지 1-2개.`}]); setReplyText(extractText(data).trim()); }
    catch {} setAiReplying(false);
  };

  const calDays = () => ({first:new Date(calYear,calMonth,1).getDay(),total:new Date(calYear,calMonth+1,0).getDate()});
  const postsOnDay = (d) => posts.filter(p=>{const dt=new Date(p.date);return dt.getDate()===d&&dt.getMonth()===calMonth&&dt.getFullYear()===calYear;});

  // ── STYLES ────────────────────────────────────────────────────
  const C = {
    purple:"#8435F3", purpleDark:"#5B2EFF", purpleLight:"#8E5CFF",
    purpleBg:"rgba(132,53,243,0.05)", purpleBorder:"rgba(132,53,243,0.3)",
    gray50:"#F9FAFB", gray100:"#F3F4F6", gray200:"#E5E7EB",
    gray400:"#9CA3AF", gray500:"#6B7280", gray700:"#374151", gray900:"#111827",
    green:"#059669", greenBg:"#D1FAE5", amber:"#D97706", amberBg:"#FFFBEB",
    red:"#E11D48", redBg:"#FFE4E6", white:"#FFFFFF",
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.gray50,fontFamily:"'Pretendard','Apple SD Gothic Neo',-apple-system,sans-serif",color:C.gray900}}>

      {/* ── SIDEBAR ── */}
      <div style={{width:256,flexShrink:0,position:"fixed",top:0,left:0,height:"100vh",background:"rgba(255,255,255,0.95)",backdropFilter:"blur(12px)",borderRight:`1px solid ${C.gray200}`,display:"flex",flexDirection:"column",zIndex:50}}>

        {/* Logo */}
        <div style={{padding:"24px 20px 20px",borderBottom:`1px solid ${C.gray200}`}}>
          <div style={{fontSize:13,fontWeight:800,letterSpacing:".1em",color:C.gray900,marginBottom:4}}>AUTO TIKTOK STUDIO</div>
          <div style={{fontSize:11,color:C.gray400}}>버추얼 인플루언서 자동화</div>
        </div>

        {/* TikTok 상태 */}
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.gray200}`}}>
          {tiktokToken ? (
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:8,background:C.purpleBg,border:`1px solid ${C.purpleBorder}`,marginBottom:8}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#4ade80",flexShrink:0,display:"inline-block"}}/>
                <span style={{fontSize:12,fontWeight:600,color:C.purple,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>@{tiktokUser||"연결됨"}</span>
              </div>
              <button onClick={logoutTikTok} style={{width:"100%",padding:"6px",borderRadius:6,border:`1px solid ${C.gray200}`,background:"transparent",fontSize:11,color:C.gray500,cursor:"pointer"}}>로그아웃</button>
            </div>
          ) : (
            <button onClick={loginTikTok} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
              🔗 TikTok 연결
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{padding:"10px 10px",flex:1,overflowY:"auto"}}>
          {NAV.map((n,i)=>(
            <button key={n.id} onClick={()=>setTab(n.id)} style={{
              width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",
              background:tab===n.id?C.purpleBg:"transparent",
              color:tab===n.id?C.purple:C.gray500,
              fontWeight:tab===n.id?600:400,fontSize:13,cursor:"pointer",marginBottom:2,textAlign:"left",
              borderLeft:tab===n.id?`3px solid ${C.purple}`:"3px solid transparent",
            }}>
              <span style={{fontSize:15,width:20,textAlign:"center"}}>{n.icon}</span>
              <span>{n.label}</span>
              {tab===n.id&&<span style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:C.purple}}/>}
            </button>
          ))}
        </nav>

        {/* 캐릭터 요약 */}
        {personaSaved && (
          <div style={{padding:"14px 16px",borderTop:`1px solid ${C.gray200}`,background:C.gray50}}>
            <div style={{fontSize:10,fontWeight:600,color:C.gray400,letterSpacing:".05em",marginBottom:8}}>활성 캐릭터</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",flexShrink:0}}>✦</div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:C.gray900}}>{persona.name}</div>
                <div style={{fontSize:11,color:C.gray400}}>{persona.concept}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{marginLeft:256,flex:1,minHeight:"100vh"}}>

        {/* Top bar */}
        <div style={{height:56,background:C.white,borderBottom:`1px solid ${C.gray200}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",position:"sticky",top:0,zIndex:40}}>
          <div>
            <span style={{fontSize:16,fontWeight:700,color:C.gray900}}>{NAV.find(n=>n.id===tab)?.label}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {!tiktokToken && (
              <div style={{padding:"5px 12px",borderRadius:6,background:C.amberBg,border:`1px solid #FCD34D`,fontSize:12,color:C.amber}}>
                ⚠ TikTok 미연결
              </div>
            )}
            <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700}}>M</div>
          </div>
        </div>

        <div style={{padding:"28px 28px",maxWidth:1000}}>

          {/* ══ AI 스타일 ══ */}
          {tab==="style" && (
            <div>
              {/* 프리셋 */}
              <div style={{marginBottom:24}}>
                <div style={{fontSize:13,fontWeight:600,color:C.gray500,marginBottom:12}}>빠른 시작 — 프리셋 선택</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
                  {PRESETS.map(p=>(
                    <div key={p.id} onClick={()=>{setPersona(prev=>({...prev,vibe:p.vibe,speech:p.speech,concept:p.label,age:p.age,lang:p.lang}));setPersonaSaved(false);}}
                      style={{padding:"14px 10px",borderRadius:10,border:`1.5px solid ${C.gray200}`,cursor:"pointer",background:C.white,textAlign:"center",transition:"all .15s",
                        ...(persona.concept===p.label?{borderColor:C.purple,background:C.purpleBg}:{})}}>
                      <div style={{fontSize:22,marginBottom:6}}>{p.icon}</div>
                      <div style={{fontSize:11,fontWeight:600,color:persona.concept===p.label?C.purple:C.gray900}}>{p.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                {/* 왼쪽 */}
                <div>
                  {/* 채팅 */}
                  <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,overflow:"hidden",marginBottom:16}}>
                    <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.gray200}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:14,fontWeight:600}}>💬 AI 채팅으로 캐릭터 설정</span>
                      <span style={{fontSize:11,color:C.gray400}}>자유롭게 말해보세요</span>
                    </div>
                    <div ref={chatRef} style={{height:220,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10}}>
                      {chatMsgs.map((m,i)=>(
                        <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",gap:8}}>
                          <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",
                            background:m.role==="user"?C.purple:C.gray100,color:m.role==="user"?"#fff":C.gray900,fontSize:13,lineHeight:1.7}}>
                            {m.text||"..."}
                          </div>
                          {/* 캐릭터 카드 제안 */}
                          {m.role==="ai" && m.suggestion && (
                            <div style={{width:"100%",maxWidth:"85%",padding:14,background:"#FFF0F5",border:`1.5px solid #F9A8D4`,borderRadius:12}}>
                              <div style={{fontSize:11,fontWeight:700,color:"#C4267D",marginBottom:10}}>✦ 추천 캐릭터</div>
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                                {[["이름","name"],["나이","age"],["언어","lang"],["무드","vibe"],["말투","speech"],["컨셉","concept"]].map(([lbl,key])=>(
                                  m.suggestion[key] && (
                                    <div key={key} style={{background:C.white,borderRadius:7,padding:"7px 10px"}}>
                                      <div style={{fontSize:10,color:C.gray400,marginBottom:2}}>{lbl}</div>
                                      <div style={{fontSize:12,fontWeight:600,color:C.gray900}}>{m.suggestion[key]}</div>
                                    </div>
                                  )
                                ))}
                              </div>
                              <button onClick={()=>{setPersona(prev=>({...prev,...m.suggestion}));setPersonaSaved(false);setChatMsgs(p=>p.map((x,xi)=>xi===i?{...x,applied:true}:x));}}
                                style={{width:"100%",padding:"8px",borderRadius:7,border:"none",background:m.applied?C.gray200:C.purple,color:m.applied?C.gray500:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                                {m.applied?"✓ 적용됨":"프리뷰에 적용 →"}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {chatLoading && (
                        <div style={{display:"flex",alignItems:"center",gap:6,padding:"10px 14px",borderRadius:"12px 12px 12px 2px",background:C.gray100,width:"fit-content"}}>
                          <span style={{fontSize:12,color:C.gray500}}>생성 중...</span>
                        </div>
                      )}
                    </div>
                    <div style={{padding:12,borderTop:`1px solid ${C.gray200}`,display:"flex",gap:8}}>
                      <input style={{flex:1,border:`1px solid ${C.gray200}`,borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",background:C.white}}
                        value={chatInput} onChange={e=>setChatInput(e.target.value)}
                        onKeyPress={e=>e.key==="Enter"&&sendChat()} placeholder="예: 20대 K뷰티 언니, 발랄하게..." />
                      <button onClick={sendChat} disabled={!chatInput.trim()||chatLoading}
                        style={{padding:"9px 16px",borderRadius:8,border:"none",background:C.purple,color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",opacity:!chatInput.trim()||chatLoading?0.5:1}}>전송</button>
                    </div>
                  </div>

                  {/* 레퍼런스 분석 */}
                  <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:18}}>
                    <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>🔍 레퍼런스 계정 분석</div>
                    <div style={{display:"flex",gap:8,marginBottom:12}}>
                      <input style={{flex:1,border:`1px solid ${C.gray200}`,borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none"}}
                        value={refUrl} onChange={e=>{setRefUrl(e.target.value);setRefAnalysis(null);}} placeholder="@username 또는 TikTok URL" />
                      <button onClick={analyzeRef} disabled={analyzing||!refUrl.trim()}
                        style={{padding:"9px 16px",borderRadius:8,border:"none",background:analyzing?C.gray200:C.gray900,color:analyzing?C.gray500:"#fff",fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
                        {analyzing?"분석 중...":"분석"}
                      </button>
                    </div>
                    {analyzing && (
                      <div style={{padding:"16px",background:C.gray50,borderRadius:9,fontSize:13,color:C.gray500,textAlign:"center"}}>
                        🔍 스타일 분석 중...
                      </div>
                    )}
                    {refAnalysis && (
                      <div style={{border:`1px solid ${C.gray200}`,borderRadius:10,overflow:"hidden"}}>
                        <div style={{padding:"12px 14px",background:C.gray50,borderBottom:`1px solid ${C.gray200}`}}>
                          <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{refAnalysis.account}</div>
                          <div style={{fontSize:12,color:C.gray500}}>{refAnalysis.summary}</div>
                        </div>
                        <div style={{padding:14}}>
                          <div style={{fontSize:11,fontWeight:600,color:C.gray400,marginBottom:10}}>유사 스타일 추천</div>
                          {refAnalysis.suggestions?.map((s,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderRadius:8,border:`1px solid ${C.gray200}`,marginBottom:6,background:C.white}}>
                              <div>
                                <div style={{fontSize:13,fontWeight:600}}>{s.label}</div>
                                <div style={{fontSize:11,color:C.gray400,marginTop:2}}>{s.desc}</div>
                              </div>
                              <button onClick={()=>{setPersona(prev=>({...prev,...s.persona}));setPersonaSaved(false);}}
                                style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${C.purpleBorder}`,background:C.purpleBg,color:C.purple,fontSize:12,fontWeight:500,cursor:"pointer"}}>
                                적용
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 오른쪽: 캐릭터 프리뷰 */}
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20,height:"fit-content"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                    <span style={{fontSize:14,fontWeight:600}}>캐릭터 프리뷰</span>
                    {personaSaved
                      ? <span style={{padding:"3px 10px",borderRadius:20,background:C.greenBg,color:C.green,fontSize:11,fontWeight:600}}>✓ 저장됨</span>
                      : <button onClick={()=>setPersonaSaved(true)} style={{padding:"7px 16px",borderRadius:6,border:"none",background:C.purple,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>💾 저장</button>
                    }
                  </div>

                  {/* 아바타 */}
                  <div style={{textAlign:"center",marginBottom:20}}>
                    <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${C.purpleLight},${C.purpleDark})`,margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff"}}>✦</div>
                    <div style={{fontSize:20,fontWeight:800,color:C.gray900}}>{persona.name||"미설정"}</div>
                    <div style={{fontSize:12,color:C.gray400,marginTop:4}}>{persona.age}세 · {persona.lang}</div>
                    {personaSaved && <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:4,padding:"4px 12px",borderRadius:20,background:C.purpleBg,fontSize:11,color:C.purple,fontWeight:600}}>✦ 활성 캐릭터</div>}
                  </div>

                  {/* 속성 편집 */}
                  <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:16}}>
                    {[["무드·분위기","vibe"],["말투 스타일","speech"],["컨셉","concept"]].map(([label,key])=>(
                      <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.gray100}`}}>
                        <span style={{fontSize:12,color:C.gray500,flexShrink:0,width:80}}>{label}</span>
                        <input style={{flex:1,fontSize:13,color:C.gray900,fontWeight:500,textAlign:"right",border:"none",outline:"none",background:"transparent"}}
                          value={persona[key]||""} onChange={e=>{setPersona(prev=>({...prev,[key]:e.target.value}));setPersonaSaved(false);}} />
                      </div>
                    ))}
                  </div>

                  {/* 샘플 멘트 */}
                  <div style={{padding:"14px",background:C.gray50,borderRadius:10,border:`1px solid ${C.gray100}`}}>
                    <div style={{fontSize:11,color:C.gray400,marginBottom:6,fontWeight:500}}>샘플 멘트</div>
                    <div style={{fontSize:13,color:C.gray700,lineHeight:1.8,fontStyle:"italic"}}>
                      "안녕~ 오늘은 {persona.concept||"K뷰티"} 꿀템 가져왔어! {persona.vibe||""}한 느낌으로 소개할게 ✨"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ 콘텐츠 생성 ══ */}
          {tab==="create" && (
            <div>
              {step===1 && (
                <div style={{maxWidth:600}}>
                  <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:24}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.gray500,marginBottom:6}}>참조 영상 URL</div>
                    <input style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"11px 14px",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:14}}
                      value={srcUrl} onChange={e=>setSrcUrl(e.target.value)} placeholder="https://www.tiktok.com/@user/video/..." />
                    <button onClick={generateContent} disabled={!srcUrl.trim()}
                      style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:srcUrl.trim()?C.purple:C.gray200,color:srcUrl.trim()?"#fff":C.gray400,fontSize:14,fontWeight:600,cursor:"pointer"}}>
                      ⚡ AI 콘텐츠 생성
                    </button>
                    <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.gray200}`}}>
                      <div style={{fontSize:12,color:C.gray400,marginBottom:10}}>TikTok 트렌드 참고</div>
                      <div style={{display:"flex",gap:8}}>
                        {[["# 해시태그","https://ads.tiktok.com/business/creativecenter/trend/hashtag/pc/en"],["♪ 음악","https://ads.tiktok.com/business/creativecenter/trend/sound/pc/en"],["▷ 바이럴","https://ads.tiktok.com/business/creativecenter/trend/video/pc/en"]].map(([l,u],i)=>(
                          <a key={i} href={u} target="_blank" rel="noreferrer" style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${C.gray200}`,background:C.white,fontSize:12,color:C.gray500,textDecoration:"none",textAlign:"center",display:"block"}}>
                            {l} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {step===2 && (
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:"56px 40px",textAlign:"center",maxWidth:580}}>
                  <div style={{fontSize:32,marginBottom:14}}>⚡</div>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>AI가 콘텐츠를 만드는 중...</div>
                  <div style={{fontSize:13,color:C.gray400}}>스크립트 · 자막 · 해시태그 생성 중</div>
                </div>
              )}
              {step===3 && gen && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                  <div>
                    <div style={{background:C.white,border:`2px solid ${C.purple}`,borderRadius:12,padding:18,marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:600,color:C.purple,marginBottom:8}}>🎯 HOOK — 첫 3초</div>
                      <div style={{fontSize:16,fontWeight:700,color:C.gray900,lineHeight:1.6}}>{gen.hook}</div>
                    </div>
                    <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:18,marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:600,color:C.gray400,marginBottom:10}}>자막 선택</div>
                      {gen.captions?.map((c,i)=>(
                        <div key={i} onClick={()=>setCaption(c)} style={{padding:"10px 12px",borderRadius:8,border:`1.5px solid ${caption===c?C.purple:C.gray200}`,background:caption===c?C.purpleBg:C.white,color:caption===c?C.purple:C.gray700,fontSize:13,cursor:"pointer",marginBottom:6,lineHeight:1.6}}>
                          {c}
                        </div>
                      ))}
                    </div>
                    <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:18}}>
                      <div style={{fontSize:11,fontWeight:600,color:C.gray400,marginBottom:8}}>해시태그</div>
                      <div>{gen.hashtags?.map((h,i)=><span key={i} style={{display:"inline-flex",padding:"3px 9px",borderRadius:20,fontSize:12,margin:2,background:C.purpleBg,color:C.purple}}>{h}</span>)}</div>
                      <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.gray100}`}}>
                        <div style={{fontSize:11,color:C.gray400,marginBottom:4}}>CTA</div>
                        <div style={{fontSize:13,color:C.purpleDark,fontWeight:500}}>{gen.cta}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                      <div style={{width:220,height:390,background:"#0a0a0a",borderRadius:24,position:"relative",overflow:"hidden",border:"5px solid #1a1a1a"}}>
                        <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#1a0820,#0a1020)"}} />
                        <div style={{position:"absolute",bottom:60,left:0,right:0,padding:"0 12px"}}>
                          <div style={{background:"rgba(0,0,0,.75)",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#fff",lineHeight:1.6,textAlign:"center"}}>
                            {caption||gen.hook}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:18,marginBottom:14}}>
                      <div style={{fontSize:11,color:C.gray400,marginBottom:6}}>스크립트 ({gen.duration}초)</div>
                      <div style={{fontSize:13,color:C.gray700,lineHeight:1.8,maxHeight:80,overflowY:"auto"}}>{gen.script}</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>setTab("schedule")} style={{flex:1,padding:"11px",borderRadius:8,border:"none",background:C.purple,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>📅 예약하기</button>
                      <button onClick={()=>{setStep(1);setGen(null);}} style={{padding:"11px 16px",borderRadius:8,border:`1px solid ${C.gray200}`,background:C.white,fontSize:13,cursor:"pointer"}}>다시 생성</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ 영상 제작 ══ */}
          {tab==="video" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              {/* HeyGen */}
              <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:22,borderTop:`3px solid ${C.purple}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                  <div style={{width:38,height:38,borderRadius:9,background:C.purpleBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎭</div>
                  <div><div style={{fontSize:15,fontWeight:700}}>HeyGen</div><div style={{fontSize:11,color:C.gray400}}>아바타 말하는 영상</div></div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.gray500,marginBottom:8}}>아바타</div>
                  {HEYGEN_AVATARS.map(a=>(
                    <div key={a.id} onClick={()=>setSelectedAvatar(a.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,border:`1.5px solid ${selectedAvatar===a.id?C.purple:C.gray200}`,cursor:"pointer",background:selectedAvatar===a.id?C.purpleBg:C.white,marginBottom:6}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:C.gray100,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{a.thumb}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:selectedAvatar===a.id?C.purple:C.gray900}}>{a.name}</div>
                        <div style={{fontSize:11,color:C.gray400}}>{a.style}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.gray500,marginBottom:6}}>스크립트</div>
                  <textarea style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"10px 12px",fontSize:13,minHeight:80,resize:"vertical",outline:"none",boxSizing:"border-box"}}
                    value={heygenScript} onChange={e=>setHeygenScript(e.target.value)} placeholder="아바타가 말할 스크립트..." />
                </div>
                <button onClick={simulateHeygen} disabled={heygenGenerating||!heygenScript.trim()}
                  style={{width:"100%",padding:"11px",borderRadius:8,border:"none",background:heygenGenerating?C.gray200:C.purple,color:heygenGenerating?C.gray500:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  {heygenGenerating?"⏳ "+heygenProgress:"🎭 HeyGen 영상 생성"}
                </button>
                {heygenError && <div style={{marginTop:10,padding:"10px 14px",background:C.redBg,borderRadius:8,fontSize:12,color:C.red}}>⚠ {heygenError}</div>}
                {heygenResult && (
                  <div style={{marginTop:14,padding:14,background:C.greenBg,borderRadius:10}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.green,marginBottom:10}}>✓ 영상 생성 완료!</div>
                    {heygenResult.thumbnailUrl && <img src={heygenResult.thumbnailUrl} style={{width:"100%",borderRadius:8,marginBottom:10}} alt="thumbnail"/>}
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button onClick={()=>setTab("schedule")} style={{flex:1,padding:"9px",borderRadius:7,border:"none",background:C.purple,color:"#fff",fontSize:12,cursor:"pointer"}}>📅 예약</button>
                      {heygenResult.videoUrl && <a href={heygenResult.videoUrl} target="_blank" rel="noreferrer" style={{padding:"9px 14px",borderRadius:7,border:`1px solid ${C.gray200}`,fontSize:12,color:C.gray700,textDecoration:"none"}}>⬇ 다운로드</a>}
                    </div>
                    {heygenResult.videoUrl && (
                      <div style={{marginTop:8}}>
                        <button onClick={()=>uploadToTikTok(heygenResult.videoUrl,gen?.hook||"")} disabled={tiktokUploading}
                          style={{width:"100%",padding:"9px",borderRadius:7,border:"none",background:"#010101",color:"#fff",fontSize:12,cursor:"pointer",opacity:tiktokUploading?0.6:1}}>
                          {tiktokUploading?"⏳ 업로드 중...":"▶ TikTok 바로 올리기"}
                        </button>
                        {tiktokUploadResult && <div style={{marginTop:6,padding:"8px",background:C.greenBg,borderRadius:7,fontSize:12,color:C.green,textAlign:"center"}}>{tiktokUploadResult.status}</div>}
                        {tiktokUploadError && <div style={{marginTop:6,padding:"8px",background:C.redBg,borderRadius:7,fontSize:12,color:C.red}}>⚠ {tiktokUploadError}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Higgsfield */}
              <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:22,borderTop:"3px solid #4F46E5"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                  <div style={{width:38,height:38,borderRadius:9,background:"#F0EEFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚡</div>
                  <div><div style={{fontSize:15,fontWeight:700}}>Higgsfield Cloud</div><div style={{fontSize:11,color:C.gray400}}>제품 광고 · VFX 숏츠</div></div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.gray500,marginBottom:8}}>제작 모드</div>
                  <div style={{display:"flex",gap:6}}>
                    {[["product","💰 제품 광고"],["vfx","✨ VFX 숏츠"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setHiggsfieldMode(v)} style={{flex:1,padding:"9px",borderRadius:8,border:`1.5px solid ${higgsfieldMode===v?C.gray900:C.gray200}`,background:higgsfieldMode===v?C.gray900:C.white,color:higgsfieldMode===v?"#fff":C.gray500,fontSize:12,cursor:"pointer"}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {higgsfieldMode==="product" ? (
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:12,color:C.gray500,marginBottom:6}}>제품 URL</div>
                    <input style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}} value={productUrl} onChange={e=>setProductUrl(e.target.value)} placeholder="https://millimilli.com/products/..." />
                  </div>
                ) : (
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:12,color:C.gray500,marginBottom:8}}>VFX 프리셋</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {VFX_PRESETS.map(v=>(
                        <div key={v.id} onClick={()=>setSelectedVFX(v.id)} style={{padding:"10px 12px",borderRadius:9,border:`1.5px solid ${selectedVFX===v.id?C.gray900:C.gray200}`,cursor:"pointer",background:selectedVFX===v.id?C.gray900:C.white}}>
                          <div style={{fontSize:18,marginBottom:4}}>{v.icon}</div>
                          <div style={{fontSize:12,fontWeight:600,color:selectedVFX===v.id?"#fff":C.gray900}}>{v.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={()=>{setHiggsfieldGenerating(true);setTimeout(()=>{setHiggsfieldResult({mode:higgsfieldMode==="product"?"제품 광고":"VFX 숏츠"});setHiggsfieldGenerating(false);},2000);}} disabled={higgsfieldGenerating}
                  style={{width:"100%",padding:"11px",borderRadius:8,border:"none",background:"#4F46E5",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  {higgsfieldGenerating?"생성 중...":"⚡ Higgsfield 영상 생성"}
                </button>
                {higgsfieldResult && (
                  <div style={{marginTop:14,padding:14,background:C.greenBg,borderRadius:10}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.green,marginBottom:8}}>✓ 완료: {higgsfieldResult.mode}</div>
                    <button onClick={()=>setTab("schedule")} style={{padding:"7px 14px",borderRadius:7,border:"none",background:"#4F46E5",color:"#fff",fontSize:12,cursor:"pointer"}}>📅 예약</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ 콘텐츠 예약 ══ */}
          {tab==="schedule" && (
            <div>
              {schedOk && <div style={{padding:"12px 16px",background:C.greenBg,borderRadius:9,marginBottom:16,fontSize:13,color:C.green}}>✓ 예약 완료! {newDate} {newTime} {FLAG[newCountry]}</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
                {/* 캘린더 */}
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

                {/* 예약 폼 */}
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
                        <button key={c} onClick={()=>setNewCountry(c)} style={{padding:"5px 8px",borderRadius:6,border:`1.5px solid ${newCountry===c?C.purple:C.gray200}`,background:newCountry===c?C.purpleBg:C.white,fontSize:15,cursor:"pointer"}}>
                          {FLAG[c]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={()=>{if(!newDate)return;setPosts(p=>[...p,{id:Date.now(),title:gen?.hook?.slice(0,40)||"새 콘텐츠",date:newDate,time:newTime,country:newCountry,status:"scheduled",thumb:"📅"}]);setSchedOk(true);setTimeout(()=>setSchedOk(false),3000);}} disabled={!newDate}
                    style={{width:"100%",padding:"11px",borderRadius:8,border:"none",background:newDate?C.purple:C.gray200,color:newDate?"#fff":C.gray400,fontSize:14,fontWeight:600,cursor:"pointer"}}>
                    예약 확정
                  </button>
                </div>
              </div>

              {/* 예약 목록 */}
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

          {/* ══ 콘텐츠 관리 ══ */}
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
                    {editingId===p.id ? (
                      <div>
                        <input style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10}} defaultValue={p.title} onBlur={e=>setPosts(prev=>prev.map(x=>x.id===p.id?{...x,title:e.target.value}:x))}/>
                        <div style={{display:"flex",gap:8}}>
                          <input type="date" style={{flex:1,border:`1px solid ${C.gray200}`,borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none"}} defaultValue={p.date} onBlur={e=>setPosts(prev=>prev.map(x=>x.id===p.id?{...x,date:e.target.value}:x))}/>
                          <button onClick={()=>setEditingId(null)} style={{padding:"9px 16px",borderRadius:8,border:"none",background:C.purple,color:"#fff",fontSize:13,cursor:"pointer"}}>저장</button>
                        </div>
                      </div>
                    ) : (
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

          {/* ══ 성과 분석 ══ */}
          {tab==="perf" && (
            <div>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}>
                <div style={{display:"flex",gap:3,background:C.gray100,padding:3,borderRadius:9}}>
                  {[["7d","7일"],["30d","30일"],["90d","90일"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setPeriod(v)} style={{padding:"6px 16px",borderRadius:7,fontSize:12,background:period===v?C.white:"transparent",color:period===v?C.gray900:C.gray400,border:"none",cursor:"pointer",fontWeight:period===v?600:400}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
                {[["👁","조회수",PERF_DATA[period].views],["♥","좋아요",PERF_DATA[period].likes],["💬","댓글",PERF_DATA[period].comments],["✦","팔로워",PERF_DATA[period].followers]].map(([icon,label,val],i)=>(
                  <div key={i} style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20,textAlign:"center"}}>
                    <div style={{fontSize:24,marginBottom:8}}>{icon}</div>
                    <div style={{fontSize:24,fontWeight:800,color:C.gray900}}>{val}</div>
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
                      {i===0&&<span style={{padding:"2px 8px",borderRadius:20,background:"#FEF3C7",color:C.amber,fontSize:11,fontWeight:500}}>🔥 Best</span>}
                    </div>
                  ))}
                </div>
                <div style={{background:C.white,border:`1px solid ${C.gray200}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>AI 인사이트</div>
                  {[{q:"가장 반응 좋은 유형은?",a:PERF_DATA[period].top+" 스타일 — 참여율 2.3배"},{q:"최적 게시 시간은?",a:"오전 8-9시 & 저녁 9-10시"},{q:"성장 포인트는?",a:"팔로워 "+PERF_DATA[period].followers+" · 글로벌 도달 32% 상승"}].map((ins,i)=>(
                    <div key={i} style={{padding:"12px 0",borderBottom:i<2?`1px solid ${C.gray100}`:"none"}}>
                      <div style={{fontSize:11,color:C.gray400,marginBottom:4}}>Q. {ins.q}</div>
                      <div style={{fontSize:13,color:C.gray700,lineHeight:1.6}}>{ins.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ 댓글 관리 ══ */}
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
                      <button onClick={()=>setAuto(p=>({...p,[s.key]:!p[s.key]}))}
                        style={{width:42,height:23,borderRadius:12,background:auto[s.key]?C.purple:C.gray200,position:"relative",cursor:"pointer",border:"none"}}>
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
                    <div key={c.id} onClick={()=>setSelectedComment(c)} style={{padding:"12px 0",borderBottom:`1px solid ${C.gray100}`,cursor:"pointer",background:selectedComment?.id===c.id?C.gray50:"transparent"}}>
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
                  {selectedComment ? (
                    <div>
                      <div style={{padding:"10px 12px",background:C.gray50,borderRadius:9,fontSize:13,color:C.gray500,marginBottom:14,lineHeight:1.6}}>{selectedComment.text}</div>
                      <textarea style={{width:"100%",border:`1px solid ${C.gray200}`,borderRadius:8,padding:"10px 12px",fontSize:13,minHeight:80,resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:10}} value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="답글 입력..."/>
                      <div style={{display:"flex",gap:8,marginBottom:8}}>
                        <button onClick={genAiReply} disabled={aiReplying} style={{flex:1,padding:"9px",borderRadius:7,border:`1px solid ${C.purpleBorder}`,background:C.purpleBg,color:C.purple,fontSize:12,cursor:"pointer"}}>{aiReplying?"생성 중...":"✦ AI 답글 생성"}</button>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>{setComments(prev=>prev.map(x=>x.id===selectedComment.id?{...x,replied:true}:x));setReplyText("");setSelectedComment(null);}} style={{flex:1,padding:"9px",borderRadius:7,border:"none",background:C.purple,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>답글 달기</button>
                        <button onClick={()=>setComments(prev=>prev.map(x=>x.id===selectedComment.id?{...x,status:"hidden"}:x))} style={{padding:"9px 14px",borderRadius:7,border:`1px solid ${C.gray200}`,background:C.white,fontSize:12,cursor:"pointer"}}>숨기기</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{textAlign:"center",padding:"40px 0",color:C.gray200}}>
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
