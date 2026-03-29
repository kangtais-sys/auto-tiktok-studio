import { useState, useRef, useEffect } from "react";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL   = "claude-sonnet-4-20250514";
const callClaude = async (msgs) => {
  const r = await fetch(API_URL, { method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:MODEL, max_tokens:1000, messages:msgs }) });
  return r.json();
};
const extractText = (data) => (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");

const FLAG = { KR:"🇰🇷",US:"🇺🇸",JP:"🇯🇵",TH:"🇹🇭",ID:"🇮🇩",VN:"🇻🇳",BR:"🇧🇷",MY:"🇲🇾",SA:"🇸🇦",TW:"🇹🇼",FR:"🇫🇷",MX:"🇲🇽" };
const LANGS = [
  {code:"ko",flag:"🇰🇷",label:"한국어",country:"KR"},{code:"en",flag:"🇺🇸",label:"영어",country:"US"},
  {code:"ja",flag:"🇯🇵",label:"일본어",country:"JP"},{code:"th",flag:"🇹🇭",label:"태국어",country:"TH"},
  {code:"id",flag:"🇮🇩",label:"인도네시아어",country:"ID"},{code:"vi",flag:"🇻🇳",label:"베트남어",country:"VN"},
  {code:"pt",flag:"🇧🇷",label:"포르투갈어",country:"BR"},{code:"ms",flag:"🇲🇾",label:"말레이어",country:"MY"},
  {code:"ar",flag:"🇸🇦",label:"아랍어",country:"SA"},{code:"zh",flag:"🇹🇼",label:"중국어",country:"TW"},
  {code:"fr",flag:"🇫🇷",label:"프랑스어",country:"FR"},{code:"es",flag:"🇲🇽",label:"스페인어",country:"MX"},
];
const TABS = [
  {id:"style",   num:"01", label:"AI 스타일",    icon:"✦", guide:"버추얼 인플루언서 캐릭터를 먼저 설정하세요. 말투·무드·컨셉이 모든 콘텐츠에 자동 적용돼요."},
  {id:"create",  num:"02", label:"콘텐츠 생성",  icon:"⚡", guide:"참조 영상 URL을 붙여넣으면 AI가 훅·스크립트·자막·해시태그를 자동으로 만들어줘요."},
  {id:"video",   num:"03", label:"영상 제작",    icon:"🎬", guide:"HeyGen으로 아바타 영상을 만들고, Higgsfield로 제품 광고 & VFX 숏츠를 제작해요."},
  {id:"schedule",num:"04", label:"콘텐츠 예약",  icon:"📅", guide:"만들어진 콘텐츠를 원하는 날짜·시간·국가에 예약하세요. 최적 시간대를 자동으로 추천해줘요."},
  {id:"manage",  num:"05", label:"콘텐츠 관리",  icon:"📋", guide:"예약·게시된 콘텐츠를 한눈에 보고 편집·삭제·상태 변경을 할 수 있어요."},
  {id:"perf",    num:"06", label:"성과 분석",    icon:"📊", guide:"조회수·좋아요·팔로워 성장을 확인하고, AI 인사이트로 다음 콘텐츠 전략을 세워요."},
  {id:"comments",num:"07", label:"댓글 관리",    icon:"💬", guide:"판매 문의 댓글을 놓치지 말고, AI 자동 답글로 골든타임을 잡으세요."},
];
const FLOW_STEPS = [
  {id:"style",  label:"스타일 설정"},
  {id:"create", label:"콘텐츠 생성"},
  {id:"video",  label:"영상 제작"},
  {id:"schedule",label:"예약"},
  {id:"manage", label:"관리"},
  {id:"perf",   label:"성과 확인"},
  {id:"comments",label:"댓글 대응"},
];
const PRESETS = [
  {id:"kbeauty",label:"K-뷰티 글로우",icon:"✨",vibe:"청순·맑은 피부",desc:"밝고 친근한 언니"},
  {id:"luxury",label:"럭셔리 스킨",icon:"💎",vibe:"고급스럽고 세련",desc:"프리미엄 감성"},
  {id:"viral",label:"바이럴 퀸",icon:"🔥",vibe:"강렬·임팩트",desc:"3초 훅 특화"},
  {id:"calm",label:"젠 뷰티",icon:"🌿",vibe:"자연·미니멀",desc:"차분한 신뢰감"},
  {id:"funny",label:"코믹 뷰티",icon:"😂",vibe:"유머·발랄",desc:"웃기고 공감"},
  {id:"edu",label:"뷰티 교수",icon:"📚",vibe:"전문·교육",desc:"성분·이론 설명"},
];
const PERF_DATA = {
  "7d":  {views:"284K",likes:"18.2K",comments:"2,140",followers:"+892",top:"전후 변신"},
  "30d": {views:"1.2M",likes:"74K",comments:"8,900",followers:"+3.4K",top:"성분 설명"},
  "90d": {views:"3.8M",likes:"230K",comments:"27K",followers:"+11K",top:"루틴 소개"},
};
const STATUS_L = {published:"게시됨",scheduled:"예약됨",draft:"초안",failed:"실패"};
const STATUS_C = {published:"#059669",scheduled:"#4F46E5",draft:"#999",failed:"#EF4444"};
const VFX_PRESETS = [
  {id:"glow",icon:"✨",label:"글로우 스킨",desc:"피부가 빛나는 효과"},
  {id:"ba",icon:"↔",label:"전후 변환",desc:"드라마틱 비교"},
  {id:"float",icon:"💫",label:"제품 플로팅",desc:"제품이 공중에 떠"},
  {id:"matrix",icon:"🟩",label:"매트릭스",desc:"파티클 인트로"},
];
const SERVICES = [
  {id:"later",name:"Later",desc:"가장 안정적인 공식 API",icon:"L",color:"#FF6B6B",badge:"추천"},
  {id:"metricool",name:"Metricool",desc:"분석 대시보드 포함",icon:"M",color:"#4F46E5",badge:""},
  {id:"postfast",name:"PostFast",desc:"개발자 친화적·저렴",icon:"P",color:"#059669",badge:""},
  {id:"buffer",name:"Buffer",desc:"멀티채널 동시 관리",icon:"B",color:"#6366F1",badge:""},
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
  {id:1,label:"감사 KR",lang:"ko",type:"thanks",text:"감사해요 💕 @millimilli_official 에서 더 확인해보세요!"},
  {id:2,label:"감사 EN",lang:"en",type:"thanks",text:"Thank you so much! 💕 Check @millimilli_official for more!"},
  {id:3,label:"쇼핑 KR",lang:"ko",type:"shopping",text:"구매는 bio 링크에서! 지금 한정 할인 중 🎁"},
  {id:4,label:"쇼핑 EN",lang:"en",type:"shopping",text:"Purchase through the link in bio! Limited discount now 🎁"},
  {id:5,label:"부정 대응",lang:"ko",type:"negative",text:"소중한 의견 감사해요. DM으로 이야기 나눠요 😊"},
];

export default function App() {
  const [tab, setTab] = useState("create");
  const [accounts, setAccounts] = useState([]);
  const [showAccModal, setShowAccModal] = useState(false);
  const [accStep, setAccStep] = useState(1);
  const [accForm, setAccForm] = useState({service:"later",tiktokUser:"",apiKey:"",email:"",country:"KR"});
  const [accConnecting, setAccConnecting] = useState(false);
  const [tiktokToken, setTiktokToken] = useState(localStorage.getItem("tt_token")||"");
  const [tiktokUser, setTiktokUser] = useState(localStorage.getItem("tt_user")||"");
  const [tiktokUploading, setTiktokUploading] = useState(false);
  const [tiktokUploadResult, setTiktokUploadResult] = useState(null);
  const [tiktokUploadError, setTiktokUploadError] = useState("");
  const [step, setStep] = useState(1);
  const [srcUrl, setSrcUrl] = useState("");
  const [gen, setGen] = useState(null);
  const [caption, setCaption] = useState("");
  const [preset, setPreset] = useState(null);
  const [persona, setPersona] = useState({name:"MILLI",country:"KR",age:"24",vibe:"청순·글로우",speech:"친근한 언니",concept:"K뷰티 글로우"});
  const [chatMsgs, setChatMsgs] = useState([{role:"ai",text:"안녕! 캐릭터 이름을 정해줘 😊"}]);
  const [chatInput, setChatInput] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const chatRef = useRef(null);
  useEffect(() => { chatRef.current?.scrollTo(0,9999); }, [chatMsgs]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code) return;
    const savedState = sessionStorage.getItem("tt_state");
    if (state !== savedState) return;
    const CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
    const CLIENT_SECRET = import.meta.env.VITE_TIKTOK_CLIENT_SECRET;
    const codeVerifier = sessionStorage.getItem("tt_code_verifier");
    const redirectUri = window.location.origin + "/tiktok-callback";
    fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_key: CLIENT_KEY, client_secret: CLIENT_SECRET, code, grant_type: "authorization_code", redirect_uri: redirectUri, code_verifier: codeVerifier })
    }).then(r=>r.json()).then(data=>{
      if (data.access_token) {
        localStorage.setItem("tt_token", data.access_token);
        setTiktokToken(data.access_token);
        window.history.replaceState({}, "", "/");
      }
    });
  }, []);
  const [posts, setPosts] = useState(INIT_POSTS);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newCountry, setNewCountry] = useState("KR");
  const [postTextOpen, setPostTextOpen] = useState(false);
  const [postText, setPostText] = useState({caption:"",hashtags:""});
  const [schedOk, setSchedOk] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [mgmtFilter, setMgmtFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [period, setPeriod] = useState("7d");
  const [heygenKey, setHeygenKey] = useState("");
  const [higgsfieldKey, setHiggsfieldKey] = useState("");
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
  const [comments, setComments] = useState(INIT_COMMENTS);
  const [templates] = useState(INIT_TEMPLATES);
  const [auto, setAuto] = useState({simple:true,negative:true,sales:true});
  const [selectedComment, setSelectedComment] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [aiReplying, setAiReplying] = useState(false);

  const openAccModal = () => { setShowAccModal(true); setAccStep(1); setAccForm({service:"later",tiktokUser:"",apiKey:"",email:"",country:"KR"}); };
  const connectAccount = () => {
    if (!accForm.apiKey||!accForm.tiktokUser) return;
    setAccConnecting(true);
    setTimeout(() => {
      const svc = SERVICES.find(s=>s.id===accForm.service);
      setAccounts(p=>[...p,{id:Date.now(),user:accForm.tiktokUser,service:svc?.name||accForm.service,country:accForm.country}]);
      setAccStep(3); setAccConnecting(false);
    }, 1400);
  };
  const generateContent = async () => {
    setStep(2);
    try {
      const data = await callClaude([{role:"user",content:"K뷰티 TikTok 콘텐츠 만들어줘. URL: "+srcUrl+". JSON으로만: {hook,script,captions:[3개],hashtags:[8개],duration,cta}"}]);
      const txt = extractText(data).replace(/```json|```/g,"").trim();
      const m = txt.match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : null;
      if (parsed) { setGen(parsed); setCaption(parsed.captions?.[0]||""); setStep(3); } else setStep(1);
    } catch { setStep(1); }
  };
  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput; setChatInput("");
    setChatMsgs(p=>[...p,{role:"user",text:msg}]);
    try {
      const data = await callClaude([{role:"user",content:"K뷰티 버추얼 인플루언서 캐릭터 빌더. 친근하게 대화해. 메시지: \""+msg+"\". 캐릭터 완성이면 JSON {name,vibe,speech,concept} 포함"}]);
      const reply = extractText(data);
      setChatMsgs(p=>[...p,{role:"ai",text:reply}]);
    } catch {}
  };
  const calDays = () => ({ first:new Date(calYear,calMonth,1).getDay(), total:new Date(calYear,calMonth+1,0).getDate() });
  const postsOnDay = (d) => posts.filter(p=>{ const dt=new Date(p.date); return dt.getDate()===d&&dt.getMonth()===calMonth&&dt.getFullYear()===calYear; });
  const addSchedule = () => {
    if (!newDate) return;
    setPosts(p=>[...p,{id:Date.now(),title:gen?.hook?.slice(0,40)||"새 콘텐츠",date:newDate,time:newTime,country:newCountry,status:"scheduled",thumb:"📅"}]);
    setSchedOk(true); setTimeout(()=>setSchedOk(false),3000);
  };
  const simulateHeygen = async () => {
    if (!heygenScript.trim()) return;
    setHeygenGenerating(true);
    setHeygenResult(null);
    setHeygenError("");
    setHeygenProgress("영상 생성 요청 중...");
    const HEYGEN_KEY = import.meta.env.VITE_HEYGEN_API_KEY;
    const avatar = HEYGEN_AVATARS.find(a=>a.id===selectedAvatar);
    try {
      const res = await fetch("/heygen/v2/video/generate", {
        method: "POST",
        headers: { "X-Api-Key": HEYGEN_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          video_inputs: [{
            character: { type:"avatar", avatar_id: selectedAvatar==="aria"?"Abigail_expressive_2024112501":selectedAvatar==="mia"?"Abigail_standing_office_front":"Abigail_sitting_sofa_front", avatar_style:"normal" },
            voice: { type:"text", input_text: heygenScript, voice_id:"1bd001e7e50f421d891986aad5158bc8" },
          }],
          dimension: { width:720, height:1280 },
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message||"생성 실패");
      const videoId = data.data?.video_id;
      if (!videoId) throw new Error("video_id 없음");
      setHeygenProgress("렌더링 중... (1~3분 소요)");
      let attempts = 0;
      while (attempts < 36) {
        await new Promise(r=>setTimeout(r,5000));
        const sr = await fetch("/heygen/v1/video_status.get?video_id="+videoId, {
          headers: { "X-Api-Key": HEYGEN_KEY }
        });
        const sd = await sr.json();
        const status = sd.data?.status;
        setHeygenProgress("렌더링 중... "+Math.min(attempts*8,90)+"%");
        if (status === "completed") {
          setHeygenResult({ avatar:avatar?.name, duration:heygenScript.length>100?"약 30초":"약 15초", videoUrl:sd.data?.video_url, thumbnailUrl:sd.data?.thumbnail_url });
          setHeygenProgress("");
          setHeygenGenerating(false);
          return;
        } else if (status === "failed") {
          throw new Error("영상 생성 실패");
        }
        attempts++;
      }
      throw new Error("시간 초과 (3분)");
    } catch(e) {
      setHeygenError(e.message||"오류 발생");
      setHeygenProgress("");
      setHeygenGenerating(false);
    }
  };
  const simulateHighsfield = () => { setHiggsfieldGenerating(true); setTimeout(()=>{ setHiggsfieldResult({mode:higgsfieldMode==="product"?"제품 광고":"VFX 숏츠"}); setHiggsfieldGenerating(false); },2000); };
  const genAiReply = async () => {
    if (!selectedComment) return; setAiReplying(true);
    try { const data = await callClaude([{role:"user",content:"K뷰티 인플루언서 댓글 답글: \""+selectedComment.text+"\". 짧게 이모지 1-2개."}]); setReplyText(extractText(data).trim()); }
    catch {} setAiReplying(false);
  };

  // TikTok OAuth 로그인 (PKCE)
  const loginTikTok = async () => {
    const CLIENT_KEY = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
    const redirectUri = encodeURIComponent(window.location.origin + "/tiktok-callback");
    const scope = encodeURIComponent("user.info.basic,video.upload,video.list");
    const state = Math.random().toString(36).slice(2);
    // PKCE code_verifier & code_challenge 생성
    const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    sessionStorage.setItem("tt_state", state);
    sessionStorage.setItem("tt_code_verifier", codeVerifier);
    window.location.href = `https://www.tiktok.com/v2/auth/authorize?client_key=${CLIENT_KEY}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  };

  // TikTok 영상 업로드
  const uploadToTikTok = async (videoUrl, caption) => {
    if (!tiktokToken) { alert("TikTok 로그인이 필요해요!"); return; }
    if (!videoUrl) { alert("영상 URL이 없어요!"); return; }
    setTiktokUploading(true);
    setTiktokUploadError("");
    setTiktokUploadResult(null);
    try {
      // 1. 업로드 초기화
      const initRes = await fetch("/tiktok/v2/post/publish/video/init/", {
        method: "POST",
        headers: { "Authorization": "Bearer "+tiktokToken, "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({
          post_info: { title: caption||"✨ K-Beauty routine #kbeauty #skincare #millimilli", privacy_level:"SELF_ONLY", disable_duet:false, disable_comment:false, disable_stitch:false },
          source_info: { source:"PULL_FROM_URL", video_url: videoUrl }
        })
      });
      const initData = await initRes.json();
      if (initData.error?.code && initData.error.code !== "ok") throw new Error(initData.error.message||"업로드 초기화 실패");
      const publishId = initData.data?.publish_id;
      if (!publishId) throw new Error("publish_id 없음");
      // 2. 상태 확인
      let attempts = 0;
      while (attempts < 20) {
        await new Promise(r=>setTimeout(r,3000));
        const statusRes = await fetch("/tiktok/v2/post/publish/status/fetch/", {
          method: "POST",
          headers: { "Authorization": "Bearer "+tiktokToken, "Content-Type": "application/json; charset=UTF-8" },
          body: JSON.stringify({ publish_id: publishId })
        });
        const statusData = await statusRes.json();
        const status = statusData.data?.status;
        if (status === "PUBLISH_COMPLETE") {
          setTiktokUploadResult({ publishId, status:"✅ TikTok 업로드 완료!" });
          setTiktokUploading(false);
          return;
        } else if (status === "FAILED") {
          throw new Error("업로드 실패: "+statusData.data?.fail_reason);
        }
        attempts++;
      }
      throw new Error("시간 초과");
    } catch(e) {
      setTiktokUploadError(e.message||"오류 발생");
      setTiktokUploading(false);
    }
  };

  const S = {
    wrap: {minHeight:"100vh",background:"#FAFAF8",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:"#111"},
    nav:  {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 32px",height:58,background:"#fff",borderBottom:"1px solid #E8E8E4",position:"sticky",top:0,zIndex:50},
    logo: {fontSize:14,fontWeight:800,letterSpacing:".12em"},
    body: {maxWidth:1100,margin:"0 auto",padding:"28px 24px"},
    tabBar: {display:"flex",gap:2,marginBottom:12,background:"#F0F0EC",borderRadius:11,padding:4,overflowX:"auto"},
    tabBtn: (a)=>({padding:"8px 14px",borderRadius:8,border:"none",fontWeight:500,fontSize:12,cursor:"pointer",background:a?"#fff":"transparent",color:a?"#111":"#888",boxShadow:a?"0 1px 4px rgba(0,0,0,.08)":"none",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}),
    tabNum: (a)=>({fontSize:9,fontWeight:800,letterSpacing:".05em",color:a?"#C4267D":"#BBB"}),
    flowBar: {display:"flex",alignItems:"center",marginBottom:20,padding:"10px 16px",background:"#fff",border:"1px solid #E8E8E4",borderRadius:10,overflowX:"auto",gap:0},
    flowStep: (a,done)=>({display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"4px 8px",borderRadius:7,background:a?"#111":done?"#F7F7F5":"transparent",transition:"background .15s"}),
    flowLabel: (a,done)=>({fontSize:11,fontWeight:a?700:500,color:a?"#fff":done?"#059669":"#AAA",whiteSpace:"nowrap"}),
    flowNum: (a,done)=>({width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,background:a?"#C4267D":done?"#059669":"#DDDDD8",color:a||done?"#fff":"#AAA",flexShrink:0}),
    flowArrow: {fontSize:11,color:"#DDD",margin:"0 2px",flexShrink:0},
    guideBanner: {display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"linear-gradient(90deg,#FFF0F5,#F0EEFF)",border:"1px solid #E8D5F5",borderRadius:9,marginBottom:20,fontSize:12,color:"#555",lineHeight:1.6},
    card: {background:"#fff",border:"1px solid #E8E8E4",borderRadius:12,padding:20,marginBottom:16},
    cardSm: {background:"#fff",border:"1px solid #E8E8E4",borderRadius:10,padding:14,marginBottom:12},
    title: {fontSize:21,fontWeight:800,color:"#111",marginBottom:4,letterSpacing:"-.02em"},
    sub: {fontSize:13,color:"#888",marginBottom:22},
    lbl: {fontSize:11,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:".07em",marginBottom:6},
    inp: {width:"100%",border:"1px solid #DDDDD8",borderRadius:9,padding:"10px 13px",fontSize:13,color:"#111",background:"#fff",outline:"none",boxSizing:"border-box"},
    btnBlack: {display:"inline-flex",alignItems:"center",gap:7,background:"#111",color:"#fff",padding:"10px 18px",borderRadius:9,fontSize:13,fontWeight:500,border:"none",cursor:"pointer"},
    btnOut: {display:"inline-flex",alignItems:"center",background:"transparent",color:"#333",padding:"9px 16px",borderRadius:9,fontSize:13,fontWeight:500,border:"1px solid #DDDDD8",cursor:"pointer"},
    btnSm: {padding:"5px 11px",fontSize:12,borderRadius:7},
    g2: {display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:16},
    g3: {display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12},
    g4: {display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12},
    divider: {height:1,background:"#E8E8E4",margin:"14px 0"},
    badge: (t)=>({display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:500,background:t==="pink"?"#FFF0F5":t==="purple"?"#F0EEFF":t==="green"?"#EDFDF4":t==="amber"?"#FFFBEB":"#F5F5F2",color:t==="pink"?"#C4267D":t==="purple"?"#4F46E5":t==="green"?"#059669":t==="amber"?"#B45309":"#777"}),
    chip: (t)=>({display:"inline-flex",padding:"3px 9px",borderRadius:20,fontSize:12,fontWeight:500,margin:2,background:t==="pink"?"#FFF0F5":"#F5F5F2",color:t==="pink"?"#C4267D":"#555"}),
    toggle: (on)=>({width:42,height:23,borderRadius:12,background:on?"#111":"#DDDDD8",position:"relative",cursor:"pointer",flexShrink:0,border:"none"}),
    knob: (on)=>({width:17,height:17,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:on?22:3,transition:"left .2s"}),
    accPill: {display:"flex",alignItems:"center",gap:7,padding:"6px 13px",borderRadius:20,background:"#F5F5F2",fontSize:12,fontWeight:500,color:"#555"},
    dot: {width:7,height:7,borderRadius:"50%",background:"#059669",flexShrink:0,display:"inline-block"},
  };

  const postRow = (p, extra) => (
    <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:"1px solid #E8E8E4"}}>
      <div style={{width:38,height:38,borderRadius:9,background:"#F5F5F2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>{p.thumb}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
        <div style={{fontSize:11,color:"#999",marginTop:2}}>{p.date} {p.time} · {FLAG[p.country]}</div>
      </div>
      <span style={S.badge(p.status==="published"?"green":p.status==="scheduled"?"purple":p.status==="failed"?"amber":"gray")}>{STATUS_L[p.status]}</span>
      {extra}
    </div>
  );

  return (
    <div style={S.wrap}>

      {/* ── NAV ── */}
      <div style={S.nav}>
        <span style={S.logo}>AUTO TIKTOK STUDIO</span>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={S.accPill}>
            <span style={S.dot} />
            @{accounts[0]?.user} · {accounts[0]?.service}
            {accounts.length > 1 && <span style={{color:"#999"}}> +{accounts.length-1}</span>}
          </div>
          {tiktokToken ? (
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:"#111",fontSize:12,fontWeight:600,color:"#fff"}}>
              <span style={{fontSize:10}}>▶</span> @{tiktokUser||"TikTok 연결됨"}
            </div>
          ) : (
            <button style={{...S.btnBlack,...S.btnSm}} onClick={loginTikTok}>🔗 TikTok 연결</button>
          )}
          <button style={{...S.btnOut,...S.btnSm}} onClick={openAccModal}>+ 계정 추가</button>
        </div>
      </div>

      <div style={S.body}>
        {/* Tab Bar */}
        <div style={S.tabBar}>
          {TABS.map(t => (
            <button key={t.id} style={S.tabBtn(tab===t.id)} onClick={()=>setTab(t.id)}>
              <span style={S.tabNum(tab===t.id)}>{t.num}</span>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Flow Step Bar */}
        <div style={S.flowBar}>
          {FLOW_STEPS.map((s,i)=>{
            const tabOrder = FLOW_STEPS.map(x=>x.id);
            const curIdx = tabOrder.indexOf(tab);
            const thisIdx = tabOrder.indexOf(s.id);
            const isActive = tab===s.id;
            const isDone = thisIdx < curIdx;
            return (
              <div key={s.id} style={{display:"flex",alignItems:"center"}}>
                <div style={S.flowStep(isActive,isDone)} onClick={()=>setTab(s.id)}>
                  <div style={S.flowNum(isActive,isDone)}>{isDone?"✓":i+1}</div>
                  <span style={S.flowLabel(isActive,isDone)}>{s.label}</span>
                </div>
                {i < FLOW_STEPS.length-1 && <span style={S.flowArrow}>→</span>}
              </div>
            );
          })}
        </div>

        {/* Guide Banner */}
        <div style={S.guideBanner}>
          <span style={{fontSize:16,flexShrink:0}}>{TABS.find(t=>t.id===tab)?.icon}</span>
          <div>
            <span style={{fontWeight:700,color:"#111",marginRight:6}}>STEP {TABS.find(t=>t.id===tab)?.num}</span>
            {TABS.find(t=>t.id===tab)?.guide}
          </div>
        </div>

        {/* ══ 콘텐츠 생성 ══ */}
        {tab==="create" && (
          <div>
            <div style={S.title}>콘텐츠 생성</div>
            <div style={S.sub}>참조 URL을 넣으면 AI가 스크립트·자막·해시태그를 만들어줘요</div>
            {step===1 && (
              <div style={{...S.card,maxWidth:580}}>
                <div style={S.lbl}>참조 영상 URL</div>
                <input style={{...S.inp,marginBottom:12}} value={srcUrl} onChange={e=>setSrcUrl(e.target.value)} placeholder="https://www.tiktok.com/@user/video/..." />
                <button style={{...S.btnBlack,width:"100%",justifyContent:"center",opacity:!srcUrl.trim()?0.4:1}} onClick={generateContent} disabled={!srcUrl.trim()}>
                  ⚡ AI 콘텐츠 생성
                </button>
                <div style={S.divider} />
                <div style={S.lbl}>TikTok 트렌드 참고</div>
                <div style={{display:"flex",gap:8}}>
                  {[["# 해시태그","https://ads.tiktok.com/business/creativecenter/trend/hashtag/pc/en"],["♪ 음악","https://ads.tiktok.com/business/creativecenter/trend/sound/pc/en"],["▷ 바이럴","https://ads.tiktok.com/business/creativecenter/trend/video/pc/en"]].map(([l,u],i)=>(
                    <a key={i} href={u} target="_blank" rel="noreferrer" style={{flex:1,padding:"9px 8px",borderRadius:8,border:"1px solid #E8E8E4",background:"#fff",fontSize:12,color:"#555",textDecoration:"none",textAlign:"center"}}>
                      {l} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
            {step===2 && (
              <div style={{...S.card,maxWidth:580,textAlign:"center",padding:"56px 40px"}}>
                <div style={{fontSize:30,marginBottom:14}}>⚡</div>
                <div style={{fontSize:15,fontWeight:600,color:"#111",marginBottom:6}}>AI가 콘텐츠를 만드는 중...</div>
                <div style={{fontSize:13,color:"#999"}}>스크립트 · 자막 · 해시태그 생성 중</div>
              </div>
            )}
            {step===3 && gen && (
              <div style={S.g2}>
                <div>
                  <div style={{...S.card,borderLeft:"3px solid #C4267D",marginBottom:14}}>
                    <div style={S.lbl}>🎯 HOOK — 첫 3초</div>
                    <div style={{fontSize:15,fontWeight:600,color:"#111",lineHeight:1.7}}>{gen.hook}</div>
                  </div>
                  <div style={{...S.card,marginBottom:14}}>
                    <div style={S.lbl}>자막 선택</div>
                    {gen.captions?.map((c,i)=>(
                      <div key={i} onClick={()=>setCaption(c)} style={{padding:"10px 12px",borderRadius:8,border:"1px solid "+(caption===c?"#111":"#E8E8E4"),background:caption===c?"#111":"#fff",color:caption===c?"#fff":"#333",fontSize:13,cursor:"pointer",marginBottom:6,lineHeight:1.6}}>
                        {c}
                      </div>
                    ))}
                  </div>
                  <div style={S.card}>
                    <div style={S.lbl}>해시태그</div>
                    <div style={{marginBottom:10}}>{gen.hashtags?.map((h,i)=><span key={i} style={S.chip("pink")}>{h}</span>)}</div>
                    <div style={S.divider} />
                    <div style={S.lbl}>CTA</div>
                    <div style={{fontSize:13,color:"#4F46E5",fontWeight:500}}>{gen.cta}</div>
                  </div>
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                    <div style={{width:210,height:375,background:"#111",borderRadius:22,position:"relative",overflow:"hidden",border:"5px solid #1a1a1a"}}>
                      <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#1a0820,#0a1020)"}} />
                      <div style={{position:"absolute",bottom:64,left:0,right:0,padding:"0 10px"}}>
                        <div style={{background:"rgba(0,0,0,.7)",borderRadius:6,padding:"7px 10px",fontSize:10,color:"#fff",lineHeight:1.5,textAlign:"center"}}>
                          {caption || gen.hook}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{...S.card,marginBottom:14}}>
                    <div style={S.lbl}>스크립트 ({gen.duration}초)</div>
                    <div style={{fontSize:12,color:"#555",lineHeight:1.8,maxHeight:80,overflowY:"auto"}}>{gen.script}</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...S.btnBlack,flex:1,justifyContent:"center"}} onClick={()=>setTab("schedule")}>📅 예약하기</button>
                    <button style={S.btnOut} onClick={()=>{setStep(1);setGen(null);}}>다시 생성</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ 영상 제작 ══ */}
        {tab==="video" && (
          <div>
            <div style={S.title}>영상 제작</div>
            <div style={S.sub}>HeyGen 아바타 영상 · Higgsfield 제품광고/VFX</div>
            <div style={{...S.card,padding:"14px 18px",marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:"#111",marginBottom:12}}>API 연동</div>
              <div style={S.g2}>
                <div>
                  <div style={S.lbl}>HeyGen API Key</div>
                  <div style={{display:"flex",gap:8}}>
                    <input style={{...S.inp,flex:1}} type="password" value={heygenKey} onChange={e=>setHeygenKey(e.target.value)} placeholder="hg_xxxxxxxxxxxxxxxx" />
                    <div style={{display:"flex",alignItems:"center",padding:"0 10px",borderRadius:9,border:"1px solid #E8E8E4",background:heygenKey?"#EDFDF4":"#F7F7F5",fontSize:12,color:heygenKey?"#059669":"#AAA",whiteSpace:"nowrap"}}>
                      {heygenKey?"✓":"미연결"}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={S.lbl}>Higgsfield Cloud API Key</div>
                  <div style={{display:"flex",gap:8}}>
                    <input style={{...S.inp,flex:1}} type="password" value={higgsfieldKey} onChange={e=>setHiggsfieldKey(e.target.value)} placeholder="hf_cloud_xxxxxxxx" />
                    <div style={{display:"flex",alignItems:"center",padding:"0 10px",borderRadius:9,border:"1px solid #E8E8E4",background:higgsfieldKey?"#EDFDF4":"#F7F7F5",fontSize:12,color:higgsfieldKey?"#059669":"#AAA",whiteSpace:"nowrap"}}>
                      {higgsfieldKey?"✓":"미연결"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={S.g2}>
              <div style={{...S.card,borderTop:"3px solid #C4267D"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <div style={{width:36,height:36,borderRadius:9,background:"#FFF0F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎭</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#111"}}>HeyGen</div>
                    <div style={{fontSize:11,color:"#999"}}>아바타 말하는 영상</div>
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={S.lbl}>아바타</div>
                  {HEYGEN_AVATARS.map(a=>(
                    <div key={a.id} onClick={()=>setSelectedAvatar(a.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,border:"1.5px solid "+(selectedAvatar===a.id?"#111":"#E8E8E4"),cursor:"pointer",background:selectedAvatar===a.id?"#111":"#fff",marginBottom:6}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:"#F5F5F2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{a.thumb}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:selectedAvatar===a.id?"#fff":"#111"}}>{a.name}</div>
                        <div style={{fontSize:11,color:selectedAvatar===a.id?"rgba(255,255,255,.6)":"#999"}}>{a.style}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{marginBottom:14}}>
                  <div style={S.lbl}>스크립트</div>
                  <textarea style={{...S.inp,minHeight:80,resize:"vertical",display:"block"}} value={heygenScript} onChange={e=>setHeygenScript(e.target.value)} placeholder="아바타가 말할 스크립트..." />
                </div>
                <button style={{...S.btnBlack,width:"100%",justifyContent:"center"}} onClick={simulateHeygen} disabled={heygenGenerating||!heygenScript.trim()}>
                  {heygenGenerating?"⏳ "+heygenProgress:"🎭 HeyGen 영상 생성"}
                </button>
                {heygenGenerating && (
                  <div style={{marginTop:12,height:4,background:"#E8E8E4",borderRadius:99}}>
                    <div style={{height:4,borderRadius:99,background:"#C4267D",width:heygenProgress.includes("%")?heygenProgress.split("%")[0].split(" ").pop()+"%":"20%",transition:"width .5s"}} />
                  </div>
                )}
                {heygenError && (
                  <div style={{marginTop:12,padding:"10px 14px",background:"#FEF2F2",borderRadius:9,fontSize:12,color:"#DC2626"}}>
                    ⚠ {heygenError}
                  </div>
                )}
                {heygenResult && (
                  <div style={{marginTop:14,padding:14,background:"#EDFDF4",border:"1px solid #6EE7B7",borderRadius:10}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#059669",marginBottom:10}}>✓ 영상 생성 완료!</div>
                    {heygenResult.thumbnailUrl && (
                      <img src={heygenResult.thumbnailUrl} style={{width:"100%",borderRadius:8,marginBottom:10}} alt="thumbnail" />
                    )}
                    <div style={{fontSize:12,color:"#555",marginBottom:10}}>{heygenResult.avatar} · {heygenResult.duration}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button style={{...S.btnBlack,...S.btnSm,flex:1,justifyContent:"center"}} onClick={()=>setTab("schedule")}>📅 예약하기</button>
                      {heygenResult.videoUrl && (
                        <a href={heygenResult.videoUrl} target="_blank" rel="noreferrer" style={{...S.btnOut,...S.btnSm}}>⬇ 다운로드</a>
                      )}
                    </div>
                    {heygenResult.videoUrl && (
                      <div style={{marginTop:10}}>
                        <button style={{...S.btnBlack,...S.btnSm,width:"100%",justifyContent:"center",background:"#010101",opacity:tiktokUploading?0.6:1}}
                          onClick={()=>uploadToTikTok(heygenResult.videoUrl, gen?.hook||"")} disabled={tiktokUploading}>
                          {tiktokUploading?"⏳ TikTok 업로드 중...":"▶ TikTok에 바로 올리기"}
                        </button>
                        {!tiktokToken && <div style={{fontSize:11,color:"#EF4444",textAlign:"center",marginTop:4}}>↑ 먼저 TikTok 연결이 필요해요</div>}
                        {tiktokUploadResult && <div style={{marginTop:8,padding:"8px 12px",background:"#EDFDF4",borderRadius:8,fontSize:12,color:"#059669",fontWeight:600}}>{tiktokUploadResult.status}</div>}
                        {tiktokUploadError && <div style={{marginTop:8,padding:"8px 12px",background:"#FEF2F2",borderRadius:8,fontSize:12,color:"#DC2626"}}>⚠ {tiktokUploadError}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{...S.card,borderTop:"3px solid #4F46E5"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <div style={{width:36,height:36,borderRadius:9,background:"#F0EEFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚡</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#111"}}>Higgsfield Cloud</div>
                    <div style={{fontSize:11,color:"#999"}}>제품 광고 · VFX 숏츠</div>
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={S.lbl}>제작 모드</div>
                  <div style={{display:"flex",gap:6}}>
                    {[["product","💰 제품 광고"],["vfx","✨ VFX 숏츠"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setHiggsfieldMode(v)} style={{flex:1,padding:"9px 8px",borderRadius:9,border:"1.5px solid "+(higgsfieldMode===v?"#111":"#E8E8E4"),background:higgsfieldMode===v?"#111":"#fff",color:higgsfieldMode===v?"#fff":"#555",fontSize:12,cursor:"pointer"}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {higgsfieldMode==="product" ? (
                  <div style={{marginBottom:14}}>
                    <div style={S.lbl}>제품 URL</div>
                    <input style={S.inp} value={productUrl} onChange={e=>setProductUrl(e.target.value)} placeholder="https://millimilli.com/products/..." />
                  </div>
                ) : (
                  <div style={{marginBottom:14}}>
                    <div style={S.lbl}>VFX 프리셋</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {VFX_PRESETS.map(v=>(
                        <div key={v.id} onClick={()=>setSelectedVFX(v.id)} style={{padding:"10px 12px",borderRadius:9,border:"1.5px solid "+(selectedVFX===v.id?"#111":"#E8E8E4"),cursor:"pointer",background:selectedVFX===v.id?"#111":"#fff"}}>
                          <div style={{fontSize:18,marginBottom:4}}>{v.icon}</div>
                          <div style={{fontSize:12,fontWeight:600,color:selectedVFX===v.id?"#fff":"#111"}}>{v.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button style={{...S.btnBlack,width:"100%",justifyContent:"center",background:"#4F46E5"}} onClick={simulateHighsfield} disabled={higgsfieldGenerating}>
                  {higgsfieldGenerating?"생성 중...":"⚡ Higgsfield 영상 생성"}
                </button>
                {higgsfieldResult && (
                  <div style={{marginTop:14,padding:14,background:"#EDFDF4",borderRadius:10}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#059669",marginBottom:8}}>✓ 완료: {higgsfieldResult.mode}</div>
                    <button style={{...S.btnBlack,...S.btnSm,background:"#4F46E5"}} onClick={()=>setTab("schedule")}>📅 예약</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ AI 스타일 ══ */}
        {tab==="style" && (
          <div>
            <div style={S.title}>AI 스타일 설정</div>
            <div style={S.sub}>버추얼 인플루언서 말투·무드·컨셉 설정</div>
            <div style={{...S.card,marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:14}}>스타일 프리셋</div>
              <div style={S.g3}>
                {PRESETS.map(p=>(
                  <div key={p.id} onClick={()=>{setPreset(p.id);setPersona(prev=>({...prev,vibe:p.vibe,speech:p.desc,concept:p.label}));}} style={{padding:14,borderRadius:10,border:"1.5px solid "+(preset===p.id?"#111":"#E8E8E4"),cursor:"pointer",background:preset===p.id?"#111":"#fff"}}>
                    <div style={{fontSize:20,marginBottom:6}}>{p.icon}</div>
                    <div style={{fontSize:13,fontWeight:600,color:preset===p.id?"#fff":"#111",marginBottom:3}}>{p.label}</div>
                    <div style={{fontSize:11,color:preset===p.id?"rgba(255,255,255,.6)":"#999"}}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={S.g2}>
              <div>
                <div style={{...S.card,padding:0,marginBottom:12}}>
                  <div style={{padding:"13px 17px",borderBottom:"1px solid #E8E8E4",fontSize:13,fontWeight:600,color:"#111"}}>채팅으로 설정</div>
                  <div ref={chatRef} style={{height:240,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:8}}>
                    {chatMsgs.map((m,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                        <div style={{maxWidth:"80%",padding:"9px 13px",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",background:m.role==="user"?"#111":"#F5F5F2",color:m.role==="user"?"#fff":"#111",fontSize:13,lineHeight:1.7}}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:10,borderTop:"1px solid #E8E8E4",display:"flex",gap:8}}>
                    <input style={{...S.inp,flex:1}} value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyPress={e=>e.key==="Enter"&&sendChat()} placeholder="메시지 입력..." />
                    <button style={{...S.btnBlack,...S.btnSm}} onClick={sendChat} disabled={!chatInput.trim()}>전송</button>
                  </div>
                </div>
                <div style={S.cardSm}>
                  <div style={S.lbl}>레퍼런스 계정 분석</div>
                  <div style={{display:"flex",gap:8}}>
                    <input style={{...S.inp,flex:1}} value={refUrl} onChange={e=>setRefUrl(e.target.value)} placeholder="https://www.tiktok.com/@username" />
                    <button style={{...S.btnOut,...S.btnSm}} onClick={()=>setAnalyzing(p=>!p)} disabled={analyzing}>{analyzing?"분석 중":"분석"}</button>
                  </div>
                </div>
              </div>
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:14}}>캐릭터 프리뷰</div>
                <div style={{textAlign:"center",marginBottom:18}}>
                  <div style={{width:56,height:56,borderRadius:"50%",background:"#111",margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff"}}>✦</div>
                  <div style={{fontWeight:800,fontSize:17,color:"#111"}}>{persona.name||"미설정"}</div>
                  <div style={{fontSize:12,color:"#999",marginTop:3}}>{persona.country} · {persona.age}</div>
                </div>
                {Object.entries(persona).filter(([k])=>!["country","age"].includes(k)).map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #E8E8E4"}}>
                    <span style={{fontSize:11,color:"#999",textTransform:"uppercase"}}>{k}</span>
                    <span style={{fontSize:12,color:"#111",fontWeight:500,maxWidth:"60%",textAlign:"right"}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ 콘텐츠 예약 ══ */}
        {tab==="schedule" && (
          <div>
            <div style={S.title}>콘텐츠 예약</div>
            <div style={S.sub}>예약 캘린더를 확인하고 게시 시간을 설정하세요</div>
            {schedOk && (
              <div style={{padding:"11px 16px",background:"#EDFDF4",border:"1px solid #6EE7B7",borderRadius:9,marginBottom:16,fontSize:13,color:"#065F46"}}>
                ✓ 예약 완료! {newDate} {newTime} {FLAG[newCountry]}
              </div>
            )}
            <div style={{...S.g2,marginBottom:16}}>
              <div style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <span style={{fontWeight:600,fontSize:14}}>{calYear}년 {calMonth+1}월</span>
                  <div style={{display:"flex",gap:6}}>
                    <button style={{...S.btnOut,...S.btnSm}} onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}}>‹</button>
                    <button style={{...S.btnOut,...S.btnSm}} onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}}>›</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
                  {["일","월","화","수","목","금","토"].map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:"#999",padding:"3px 0"}}>{d}</div>)}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                  {Array.from({length:calDays().first}).map((_,i)=><div key={"e"+i} />)}
                  {Array.from({length:calDays().total}).map((_,i)=>{
                    const day=i+1,dp=postsOnDay(day),today=new Date().getDate()===day&&new Date().getMonth()===calMonth&&new Date().getFullYear()===calYear;
                    return (
                      <div key={day} style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",padding:"2px 0",borderRadius:6,background:today?"#111":"transparent"}}>
                        <div style={{fontSize:12,color:today?"#fff":"#444"}}>{day}</div>
                        {dp.length>0 && <div style={{width:6,height:6,borderRadius:"50%",background:STATUS_C[dp[0].status],marginTop:1}} />}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:16}}>새 예약 추가</div>
                <div style={{marginBottom:12}}>
                  <div style={S.lbl}>날짜</div>
                  <input type="date" style={S.inp} value={newDate} onChange={e=>setNewDate(e.target.value)} />
                </div>
                <div style={{marginBottom:12}}>
                  <div style={S.lbl}>시간</div>
                  <input type="time" style={S.inp} value={newTime} onChange={e=>setNewTime(e.target.value)} />
                </div>
                <div style={{marginBottom:14}}>
                  <div style={S.lbl}>타겟 국가</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {Object.keys(FLAG).map(c=>(
                      <button key={c} onClick={()=>setNewCountry(c)} style={{padding:"5px 8px",borderRadius:7,border:"1.5px solid "+(newCountry===c?"#111":"#DDDDD8"),background:newCountry===c?"#111":"#fff",fontSize:15,cursor:"pointer"}}>
                        {FLAG[c]}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <button style={{...S.btnOut,...S.btnSm,width:"100%",justifyContent:"space-between",display:"flex"}} onClick={()=>setPostTextOpen(p=>!p)}>
                    <span>📝 게시 텍스트 설정</span><span>{postTextOpen?"▲":"▼"}</span>
                  </button>
                  {postTextOpen && (
                    <div style={{border:"1px solid #E8E8E4",borderRadius:10,padding:14,marginTop:8}}>
                      <div style={{marginBottom:10}}>
                        <div style={S.lbl}>캡션</div>
                        <textarea style={{...S.inp,minHeight:56,resize:"vertical",display:"block"}} value={postText.caption} onChange={e=>setPostText(p=>({...p,caption:e.target.value}))} placeholder="캡션 입력..." />
                      </div>
                      <div>
                        <div style={S.lbl}>해시태그</div>
                        <input style={S.inp} value={postText.hashtags} onChange={e=>setPostText(p=>({...p,hashtags:e.target.value}))} placeholder="#kbeauty #skincare #뷰티" />
                      </div>
                    </div>
                  )}
                </div>
                <button style={{...S.btnBlack,width:"100%",justifyContent:"center"}} onClick={addSchedule} disabled={!newDate}>예약 확정</button>
              </div>
            </div>
            <div style={S.card}>
              <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:14}}>예약 현황</div>
              {posts.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(p=>postRow(p,
                p.status==="scheduled"&&<button style={{...S.btnOut,...S.btnSm,color:"#DC2626",borderColor:"#FCA5A5"}} onClick={()=>setPosts(prev=>prev.filter(x=>x.id!==p.id))}>취소</button>
              ))}
            </div>
          </div>
        )}

        {/* ══ 콘텐츠 관리 ══ */}
        {tab==="manage" && (
          <div>
            <div style={S.title}>콘텐츠 관리</div>
            <div style={S.sub}>게시된 콘텐츠를 한눈에 보고 관리하세요</div>
            <div style={{display:"flex",gap:6,marginBottom:16}}>
              {["all","scheduled","published","draft"].map(f=>(
                <button key={f} onClick={()=>setMgmtFilter(f)} style={{padding:"6px 14px",borderRadius:20,border:"1px solid "+(mgmtFilter===f?"#111":"#DDDDD8"),background:mgmtFilter===f?"#111":"#fff",color:mgmtFilter===f?"#fff":"#555",fontSize:12,cursor:"pointer"}}>
                  {f==="all"?"전체":STATUS_L[f]} {f==="all"?posts.length:posts.filter(p=>p.status===f).length}
                </button>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {posts.filter(p=>mgmtFilter==="all"||p.status===mgmtFilter).map(p=>(
                <div key={p.id} style={S.card}>
                  {editingId===p.id ? (
                    <div>
                      <input style={{...S.inp,marginBottom:10}} defaultValue={p.title} onBlur={e=>setPosts(prev=>prev.map(x=>x.id===p.id?{...x,title:e.target.value}:x))} />
                      <div style={{display:"flex",gap:8}}>
                        <input type="date" style={{...S.inp,flex:1}} defaultValue={p.date} onBlur={e=>setPosts(prev=>prev.map(x=>x.id===p.id?{...x,date:e.target.value}:x))} />
                        <button style={{...S.btnBlack,...S.btnSm}} onClick={()=>setEditingId(null)}>저장</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <div style={{width:42,height:42,borderRadius:10,background:"#F5F5F2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{p.thumb}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:2}}>{p.title}</div>
                        <div style={{fontSize:11,color:"#999"}}>{p.date} · {FLAG[p.country]}</div>
                      </div>
                      <span style={S.badge(p.status==="published"?"green":p.status==="scheduled"?"purple":"gray")}>{STATUS_L[p.status]}</span>
                      <div style={{display:"flex",gap:6}}>
                        {p.status!=="published"&&<button style={{...S.btnOut,...S.btnSm}} onClick={()=>setEditingId(p.id)}>편집</button>}
                        {p.status==="draft"&&<button style={{...S.btnBlack,...S.btnSm}} onClick={()=>setPosts(prev=>prev.map(x=>x.id===p.id?{...x,status:"scheduled"}:x))}>예약</button>}
                        <button style={{...S.btnOut,...S.btnSm,color:"#DC2626",borderColor:"#FCA5A5"}} onClick={()=>setPosts(prev=>prev.filter(x=>x.id!==p.id))}>삭제</button>
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
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
              <div>
                <div style={S.title}>콘텐츠 성과</div>
                <div style={S.sub}>채널 성장과 콘텐츠 효과를 확인하세요</div>
              </div>
              <div style={{display:"flex",gap:3,background:"#EEEEE9",padding:3,borderRadius:9}}>
                {[["7d","7일"],["30d","30일"],["90d","90일"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setPeriod(v)} style={{padding:"6px 13px",borderRadius:7,fontSize:12,background:period===v?"#fff":"transparent",color:period===v?"#111":"#888",border:"none",cursor:"pointer"}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{...S.g4,marginBottom:16}}>
              {[["👁","조회수",PERF_DATA[period].views],["♥","좋아요",PERF_DATA[period].likes],["💬","댓글",PERF_DATA[period].comments],["✦","팔로워",PERF_DATA[period].followers]].map(([icon,label,val],i)=>(
                <div key={i} style={{...S.card,textAlign:"center"}}>
                  <div style={{fontSize:22,marginBottom:8}}>{icon}</div>
                  <div style={{fontSize:22,fontWeight:800,color:"#111"}}>{val}</div>
                  <div style={{fontSize:12,color:"#333",marginTop:4}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={S.g2}>
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:14}}>TOP 콘텐츠</div>
                {posts.map((p,i)=>(
                  <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<posts.length-1?"1px solid #E8E8E4":"none"}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#DDD",width:20}}>#{i+1}</div>
                    <div style={{width:34,height:34,borderRadius:8,background:"#F5F5F2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{p.thumb}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:"#111",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
                      <div style={{fontSize:11,color:"#999"}}>{FLAG[p.country]} {p.date}</div>
                    </div>
                    {i===0&&<span style={S.badge("pink")}>🔥 Best</span>}
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:14}}>AI 인사이트</div>
                {[
                  {q:"가장 반응 좋은 유형은?",a:PERF_DATA[period].top+" 스타일 — 참여율 2.3배"},
                  {q:"최적 게시 시간은?",a:"오전 8-9시 & 저녁 9-10시"},
                  {q:"성장 포인트는?",a:"팔로워 "+PERF_DATA[period].followers+" · 글로벌 도달 32% 상승"},
                ].map((ins,i)=>(
                  <div key={i} style={{padding:"11px 0",borderBottom:i<2?"1px solid #E8E8E4":"none"}}>
                    <div style={{fontSize:11,color:"#999",marginBottom:4}}>Q. {ins.q}</div>
                    <div style={{fontSize:13,color:"#111",lineHeight:1.6}}>{ins.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ 댓글 관리 ══ */}
        {tab==="comments" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
              <div>
                <div style={S.title}>댓글 관리</div>
                <div style={S.sub}>AI 자동 답글 · 판매 문의 골든타임 · 악성 댓글 관리</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <span style={S.badge("pink")}>💰 {comments.filter(c=>c.type==="sales"&&c.status==="pending").length} 판매문의</span>
                <span style={S.badge("amber")}>⏳ {comments.filter(c=>c.status==="pending").length} 미답변</span>
              </div>
            </div>
            <div style={{...S.g2,marginBottom:16}}>
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:14}}>자동화 설정</div>
                {[
                  {key:"simple",label:"단순 댓글 AI 자동 답글",sub:"AI가 즉시 처리"},
                  {key:"negative",label:"악성 댓글 자동 숨기기",sub:"브랜드 보호"},
                  {key:"sales",label:"판매 문의 즉시 알림",sub:"골든타임"},
                ].map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:i<2?"1px solid #E8E8E4":"none"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500,color:"#111"}}>{s.label}</div>
                      <div style={{fontSize:11,color:"#999",marginTop:2}}>{s.sub}</div>
                    </div>
                    <button style={S.toggle(auto[s.key])} onClick={()=>setAuto(p=>({...p,[s.key]:!p[s.key]}))}>
                      <div style={S.knob(auto[s.key])} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:14}}>이번 주 현황</div>
                <div style={S.g2}>
                  {[["전체",comments.length,"#111"],["판매",comments.filter(c=>c.type==="sales").length,"#C4267D"],["자동처리",comments.filter(c=>c.status==="auto_replied").length,"#059669"],["완료",comments.filter(c=>c.replied).length,"#4F46E5"]].map(([l,v,c],i)=>(
                    <div key={i} style={{background:"#F7F7F5",borderRadius:10,padding:"13px 16px"}}>
                      <div style={{fontSize:11,color:"#999",marginBottom:3}}>{l}</div>
                      <div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={S.divider} />
                <div style={S.lbl}>빠른 답글 템플릿</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {templates.map(t=>(
                    <button key={t.id} style={{...S.btnOut,...S.btnSm}} onClick={()=>setReplyText(t.text)}>{t.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={S.g2}>
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:14}}>댓글 목록</div>
                {comments.map(c=>(
                  <div key={c.id} onClick={()=>setSelectedComment(c)} style={{padding:"12px 0",borderBottom:"1px solid #E8E8E4",cursor:"pointer"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                          <span style={{fontSize:12,fontWeight:600,color:"#111"}}>{c.user}</span>
                          <span style={S.badge(c.type==="sales"?"pink":c.type==="negative"?"amber":"green")}>{c.type==="sales"?"💰 판매":c.type==="negative"?"⚠ 부정":"👍 긍정"}</span>
                        </div>
                        <div style={{fontSize:13,color:"#444",lineHeight:1.5}}>{c.text}</div>
                      </div>
                      {c.replied&&<div style={{color:"#059669",fontSize:11}}>✓</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{fontSize:14,fontWeight:600,color:"#111",marginBottom:14}}>
                  {selectedComment ? "@"+selectedComment.user+" 답글" : "댓글을 선택하세요"}
                </div>
                {selectedComment ? (
                  <div>
                    <div style={{padding:"10px 12px",background:"#F7F7F5",borderRadius:9,fontSize:13,color:"#555",marginBottom:14,lineHeight:1.6}}>
                      {selectedComment.text}
                    </div>
                    <textarea style={{...S.inp,minHeight:80,resize:"vertical",display:"block",marginBottom:10}} value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="답글 입력..." />
                    <div style={{display:"flex",gap:8,marginBottom:10}}>
                      <button style={{...S.btnBlack,...S.btnSm,flex:1,justifyContent:"center"}} onClick={genAiReply} disabled={aiReplying}>
                        {aiReplying?"생성 중...":"✦ AI 답글 생성"}
                      </button>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button style={{...S.btnBlack,flex:1,justifyContent:"center"}} onClick={()=>{setComments(prev=>prev.map(x=>x.id===selectedComment.id?{...x,replied:true}:x));setReplyText("");setSelectedComment(null);}}>답글 달기</button>
                      <button style={{...S.btnOut,...S.btnSm}} onClick={()=>setComments(prev=>prev.map(x=>x.id===selectedComment.id?{...x,status:"hidden"}:x))}>숨기기</button>
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign:"center",padding:"40px 0",color:"#CCC"}}>
                    <div style={{fontSize:32,marginBottom:10}}>💬</div>
                    <div style={{fontSize:13}}>왼쪽에서 댓글을 선택하세요</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ══ 계정 연동 모달 ══ */}
      {showAccModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowAccModal(false);}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:480,boxShadow:"0 20px 60px rgba(0,0,0,.2)",overflow:"hidden"}}>
            <div style={{padding:"18px 22px",borderBottom:"1px solid #E8E8E4",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:"#111"}}>TikTok 계정 연결</div>
                <div style={{fontSize:12,color:"#999",marginTop:2}}>
                  {accStep===1?"서비스 선택":accStep===2?"정보 입력":"완료!"}
                </div>
              </div>
              <button style={{fontSize:18,color:"#999",cursor:"pointer",border:"none",background:"none"}} onClick={()=>setShowAccModal(false)}>✕</button>
            </div>
            <div style={{padding:22}}>
              {accStep===1 && (
                <div>
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                    {SERVICES.map(svc=>(
                      <div key={svc.id} onClick={()=>setAccForm(p=>({...p,service:svc.id}))} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:12,border:"1.5px solid "+(accForm.service===svc.id?"#111":"#E8E8E4"),cursor:"pointer",background:accForm.service===svc.id?"#111":"#fff"}}>
                        <div style={{width:38,height:38,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:accForm.service===svc.id?"#fff":svc.color,flexShrink:0,background:accForm.service===svc.id?"rgba(255,255,255,.15)":svc.color+"22"}}>
                          {svc.icon}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:14,color:accForm.service===svc.id?"#fff":"#111"}}>
                            {svc.name}{svc.badge&&<span style={{marginLeft:8,padding:"1px 7px",borderRadius:20,fontSize:10,background:"#EDFDF4",color:"#059669"}}>{svc.badge}</span>}
                          </div>
                          <div style={{fontSize:12,color:accForm.service===svc.id?"rgba(255,255,255,.6)":"#999",marginTop:2}}>{svc.desc}</div>
                        </div>
                        {accForm.service===svc.id&&<div style={{color:"#fff",fontSize:16}}>✓</div>}
                      </div>
                    ))}
                  </div>
                  <button style={{...S.btnBlack,width:"100%",justifyContent:"center"}} onClick={()=>setAccStep(2)}>다음 →</button>
                </div>
              )}
              {accStep===2 && (
                <div>
                  <div style={{marginBottom:14}}>
                    <div style={S.lbl}>TikTok 계정 이름</div>
                    <div style={{position:"relative"}}>
                      <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#AAA"}}>@</span>
                      <input style={{...S.inp,paddingLeft:26}} value={accForm.tiktokUser} onChange={e=>setAccForm(p=>({...p,tiktokUser:e.target.value.replace("@","")}))} placeholder="your_tiktok_username" />
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <div style={S.lbl}>{SERVICES.find(s=>s.id===accForm.service)?.name} API 키</div>
                    <input type="password" style={S.inp} value={accForm.apiKey} onChange={e=>setAccForm(p=>({...p,apiKey:e.target.value}))} placeholder="API 키를 붙여넣으세요" />
                  </div>
                  <div style={{marginBottom:14}}>
                    <div style={S.lbl}>이메일 (선택)</div>
                    <input type="email" style={S.inp} value={accForm.email} onChange={e=>setAccForm(p=>({...p,email:e.target.value}))} placeholder="tiktok@email.com" />
                  </div>
                  <div style={{marginBottom:20}}>
                    <div style={S.lbl}>주 타겟 국가</div>
                    <select style={S.inp} value={accForm.country} onChange={e=>setAccForm(p=>({...p,country:e.target.value}))}>
                      {LANGS.map(l=><option key={l.country} value={l.country}>{l.flag} {l.label}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...S.btnOut,padding:"11px 16px",borderRadius:9}} onClick={()=>setAccStep(1)}>← 이전</button>
                    <button style={{...S.btnBlack,flex:1,justifyContent:"center",opacity:(!accForm.apiKey||!accForm.tiktokUser)?0.4:1}} onClick={connectAccount} disabled={accConnecting||!accForm.apiKey||!accForm.tiktokUser}>
                      {accConnecting?"연결 중...":"TikTok 계정 연결"}
                    </button>
                  </div>
                </div>
              )}
              {accStep===3 && (
                <div style={{textAlign:"center",padding:"10px 0 16px"}}>
                  <div style={{width:60,height:60,borderRadius:"50%",background:"#EDFDF4",margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>✓</div>
                  <div style={{fontWeight:700,fontSize:16,color:"#111",marginBottom:6}}>연결 완료!</div>
                  <div style={{fontSize:13,color:"#888",marginBottom:20}}>@{accForm.tiktokUser} · {SERVICES.find(s=>s.id===accForm.service)?.name}</div>
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...S.btnOut,flex:1,padding:"11px",borderRadius:9,justifyContent:"center"}} onClick={()=>{setAccStep(1);setAccForm({service:"later",tiktokUser:"",apiKey:"",email:"",country:"KR"});}}>+ 계정 추가</button>
                    <button style={{...S.btnBlack,flex:1,justifyContent:"center",padding:"11px"}} onClick={()=>setShowAccModal(false)}>완료</button>
                  </div>
                </div>
              )}
              {accounts.length>0&&accStep!==3&&(
                <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #E8E8E4"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#888",marginBottom:10}}>연결된 계정 ({accounts.length})</div>
                  {accounts.map(a=>(
                    <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #F5F5F2"}}>
                      <div style={{width:30,height:30,borderRadius:"50%",background:"#111",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>
                        {a.user.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500,color:"#111"}}>@{a.user}</div>
                        <div style={{fontSize:11,color:"#AAA"}}>{a.service} · {FLAG[a.country]}</div>
                      </div>
                      <div style={{width:6,height:6,borderRadius:"50%",background:"#059669"}} />
                      <span style={{fontSize:11,color:"#059669"}}>연결됨</span>
                      {a.id!==0&&<button style={{fontSize:11,color:"#DC2626",background:"none",border:"none",cursor:"pointer"}} onClick={()=>setAccounts(prev=>prev.filter(x=>x.id!==a.id))}>해제</button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
