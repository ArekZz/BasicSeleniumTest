const { request } = require('express');
var express = require('express');
var router = express.Router();
const { Cluster } = require('puppeteer-cluster');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

var jobs = {};
puppeteer.use(StealthPlugin());
var proxies = "string list of proxies...";
var cluster;

(async () => {
  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 8,
    puppeteer,
    puppeteerOptions:{
        headless:false, 
        args: ['--window-size=222,222', '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        `--proxy-server=http://${proxies[Math.floor(Math.random()*proxies.length)]}`
    ] 
    }
  });
  
  await cluster.task(async ({ page, data: url }) => {
      try{
        var data = url.split("|");
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
                req.abort();
            } else {
                req.continue();
            }
        });
        
        await page.goto(data[0]);
      
        await page.waitForSelector("#formCapeMove");
        const dataa = await page.evaluate(() => document.querySelector('*').outerHTML);
       if(dataa.includes("Move the cape to username")){

        jobs[data[1]] = "success";
       }
        if(dataa.includes("The cape is locked and can't be moved")){
          jobs[data[1]] = "nocape";
        }else if(dataa.includes("Invalid session")){
          jobs[data[1]] = "error";
        }
       
      }catch{
          jobs[data[1]] = "error";
      }

  });

 

  // many more pages

 
})();
/* GET home page. */
router.get("/check/:jobid",function(req,res,next){
  
  try{
    if(jobs[req.params.jobid]=="queue"){
      delete[req.params.jobid]
      res.send("queue");
    }
    if(jobs[req.params.jobid]=="success"){
      delete[req.params.jobid]
      res.send("success");
    }
    if(jobs[req.params.jobid]=="error"){
      delete[req.params.jobid]
      res.send("error");
    }
    if(jobs[req.params.jobid]=="nocape"){
      delete[req.params.jobid]
      res.send("nocape");
    }
  }catch{
    delete[req.params.jobid]
    res.send("error");
  }
})
router.post('/api/:jobid', function(req, res, next) {
  try{
    jobs[req.params.jobid] = "queue";
    cluster.queue(`${req.body.link}|${req.params.jobid}`);
    res.send("OK");
  }catch{
    delete[req.params.jobid]
    res.send("error");
  }


  //Test cluster.queue('http://optifine.net/login');
 
});

module.exports = router;
