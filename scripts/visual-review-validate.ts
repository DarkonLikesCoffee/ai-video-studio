import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
type Finding = { id?: unknown; severity?: unknown; status?: unknown };
type Report = { status?: unknown; artifact?: { videoSha256?: unknown }; inspection?: { method?: unknown; fullVideoWatched?: unknown; timestampsReviewedSeconds?: unknown; reviewer?: unknown; reviewedAt?: unknown }; findings?: unknown; corrections?: unknown; decision?: { approved?: unknown; rationale?: unknown } };
const isRecord=(v:unknown):v is Record<string,unknown>=>typeof v==="object"&&v!==null&&!Array.isArray(v);
export const validateVisualReviewReport=(report:unknown)=>{
 const errors:string[]=[];
 if(!isRecord(report)) return {errors:["Visual review report must be a JSON object."],approved:false,pending:false};
 const r=report as Report;
 if(r.status!=="pending-review"&&r.status!=="approved"&&r.status!=="rejected") errors.push("status must be pending-review, approved, or rejected.");
 if(!isRecord(r.artifact)||typeof r.artifact.videoSha256!=="string"||! /^[a-f0-9]{64}$/i.test(r.artifact.videoSha256)) errors.push("artifact.videoSha256 must be a valid SHA-256 hash.");
 if(!isRecord(r.inspection)) errors.push("inspection must be an object.");
 if(!Array.isArray(r.findings)) errors.push("findings must be an array.");
 if(!Array.isArray(r.corrections)) errors.push("corrections must be an array.");
 if(!isRecord(r.decision)||typeof r.decision.approved!=="boolean") errors.push("decision.approved must be a boolean.");
 const findings=Array.isArray(r.findings)?r.findings.filter(isRecord) as Finding[]:[];
 const ids=new Set<string>();
 for(const f of findings){
  if(typeof f.id!=="string"||!f.id.trim()) errors.push("Every finding needs a non-empty id.");
  else if(ids.has(f.id)) errors.push(`Duplicate finding id: ${f.id}`);
  else ids.add(f.id);
  if(!["blocker","major","minor"].includes(String(f.severity))) errors.push(`Finding ${String(f.id)} has invalid severity.`);
  if(!["open","resolved","accepted"].includes(String(f.status))) errors.push(`Finding ${String(f.id)} must have status open, resolved, or accepted.`);
 }
 const corrections=Array.isArray(r.corrections)?r.corrections.filter(isRecord):[];
 for(const c of corrections){
  if(typeof c.findingId!=="string"||!ids.has(c.findingId)) errors.push("Each correction must reference an existing findingId.");
  if(typeof c.description!=="string"||!c.description.trim()) errors.push("Each correction needs a description.");
  if(typeof c.verified!=="boolean") errors.push("Each correction needs verified boolean.");
 }
 const pending=r.status==="pending-review";
 const approved=r.status==="approved"&&isRecord(r.decision)&&r.decision.approved===true;
 if(approved){
  const i=r.inspection;
  if(!isRecord(i)||i.fullVideoWatched!==true) errors.push("Approval requires fullVideoWatched=true; contact sheets alone are insufficient.");
  if(!isRecord(i)||typeof i.reviewer!=="string"||!i.reviewer.trim()) errors.push("Approval requires a reviewer.");
  if(!isRecord(i)||typeof i.reviewedAt!=="string"||!i.reviewedAt.trim()||Number.isNaN(Date.parse(i.reviewedAt))) errors.push("Approval requires a valid reviewedAt timestamp.");
  if(!isRecord(i)||!Array.isArray(i.timestampsReviewedSeconds)||i.timestampsReviewedSeconds.length===0) errors.push("Approval requires reviewed timestamps.");
  if(findings.some(f=>f.severity==="blocker"&&f.status!=="resolved")) errors.push("Approval is blocked by unresolved blocker findings.");
  if(findings.some(f=>f.severity==="major"&&f.status==="open")) errors.push("Approval is blocked by open major findings.");
  if(corrections.some(c=>c.verified!==true)) errors.push("Approval is blocked by unverified corrections.");
  if(!isRecord(r.decision)||typeof r.decision.rationale!=="string"||!r.decision.rationale.trim()) errors.push("Approval requires a decision rationale.");
 }
 if(r.status==="rejected"&&(!isRecord(r.decision)||r.decision.approved!==false)) errors.push("Rejected report must set decision.approved=false.");
 if(r.status==="approved"&&(!isRecord(r.decision)||r.decision.approved!==true)) errors.push("Approved report must set decision.approved=true.");
 return {errors,approved,pending};
};
const main=async()=>{
 const path=resolve(process.argv[2]??"");
 if(!process.argv[2]) throw new Error("Usage: npm run qa:visual-review-validate -- report.json");
 const report=JSON.parse(await readFile(path,"utf8"));
 const result=validateVisualReviewReport(report);
 if(result.errors.length){console.error(result.errors.join("\\n"));process.exitCode=1;return;}
 console.log(result.pending?"Visual review is pending; report structure is valid.":"Visual review report structure is valid.");
 if(result.approved) console.log("Report is approved, subject to all review rules.");
};
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
