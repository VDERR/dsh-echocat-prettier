import puppeteer from 'puppeteer-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-output',{recursive:true});
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,ignoreDefaultArgs:['--hide-scrollbars'],userDataDir:resolve('test-output/browser-profile-standalone-'+Date.now()),args:['--disable-background-networking','--disable-component-update']});
const report={version:'2.3.4',file:resolve('deliverables/20260924_GPTEchoCat回复美化插件发布版离线预览_V2.3.4.html'),liveDSH:false,requests:[],errors:[]};
try{
const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.setRequestInterception(true);page.on('request',r=>{report.requests.push(r.url());if(r.url().startsWith('file:')||r.url().startsWith('data:'))r.continue();else r.abort();});
await page.goto(pathToFileURL(report.file).href,{waitUntil:'load'});await page.waitForSelector('#after [data-ecp-prose]');
assert.equal(await page.$$eval('.preset-tile',nodes=>nodes.length),15);assert.equal(await page.$$eval('.layout-tile',nodes=>nodes.length),9);
await page.click('.ecp-sidebar-open');await page.waitForSelector('.ecp-final-dialog[open]');assert.equal(await page.$$eval('.ecp-final-style',nodes=>nodes.length),15);await page.keyboard.press('Escape');
assert.deepEqual(report.errors,[]);assert.ok(report.requests.filter(x=>x.startsWith('file:')).length>=1);assert.equal(new Set(report.requests.filter(x=>x.startsWith('file:'))).size,1);assert.ok(report.requests.every(x=>x.startsWith('file:')||x.startsWith('data:')));
assert.equal(await page.$$eval('#after [data-ecp-prose]',els=>els.length),1);report.pass=true;
console.log('Standalone V2.3.4 file:// preview loaded with 15 styles, 9 layouts, release controls and long-answer protection.');
}finally{await writeFile('test-output/standalone-final-results.json',JSON.stringify(report,null,2));await browser.close();}
