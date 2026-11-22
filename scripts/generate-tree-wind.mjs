import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const sampleRate=22050,duration=20,count=Math.floor(sampleRate*duration);
const buffer=Buffer.alloc(44+count*2);
buffer.write("RIFF",0);buffer.writeUInt32LE(36+count*2,4);buffer.write("WAVE",8);buffer.write("fmt ",12);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(sampleRate,24);buffer.writeUInt32LE(sampleRate*2,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write("data",36);buffer.writeUInt32LE(count*2,40);
let seed=0x5a17;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1};let lp1=0,lp2=0,lp3=0;const alpha1=.018,alpha2=.07,alpha3=.24;
for(let i=0;i<count;i++){const t=i/sampleRate,white=random();lp1+=alpha1*(white-lp1);lp2+=alpha2*(white-lp2);lp3+=alpha3*(white-lp3);const airy=(lp3-lp2)*.65+(lp2-lp1)*.8+lp1*.65;const gust=.52+.25*Math.sin(2*Math.PI*.075*t+.4)+.13*Math.sin(2*Math.PI*.19*t+1.2)+.07*Math.sin(2*Math.PI*.035*t);const swell=.92+.08*Math.sin(2*Math.PI*.31*t);const fadeIn=Math.min(1,t/1.1),fadeOut=Math.min(1,(duration-t)/1.35),envelope=Math.max(0,Math.min(fadeIn,fadeOut));const sample=Math.max(-1,Math.min(1,airy*gust*swell*envelope*.42));buffer.writeInt16LE(Math.round(sample*32767),44+i*2)}
const out=resolve("projects/windy-tree/assets/audio/wind.wav");await mkdir(resolve("projects/windy-tree/assets/audio"),{recursive:true});await writeFile(out,buffer);console.log("Generated original 20-second soft wind ambience:",out);
