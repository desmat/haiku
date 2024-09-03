import { DailyHaiku } from "@/types/Haiku";
import { DailyHaikudle } from "@/types/Haikudle";

export async function triggerDailyHaikuSaved(dailyHaiku: DailyHaiku) {
  const url = process.env.WEBHOOK_DAILY_HAIKU_SAVED;
  console.log('>> app.services.webhooks.triggerDailyHaikuSaved', { dailyHaiku, url });

  if (!url) {
    console.warn(">> app.services.webhooks.triggerDailyHaikuSaved WARNING: WEBHOOK_DAILY_HAIKU_SAVED variable not set");
    return;
  }
  
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(dailyHaiku),
  });

  if (res.status != 200) {
    console.error(">> app.services.webhooks.triggerDailyHaikuSaved ERROR", { res });
  }

  console.log('>> app.services.webhooks.triggerDailyHaikuSaved', { res });

  // const ret = await res.json();
  // console.log('>> app.services.webhooks.triggerDailyHaikuSaved', { ret });

  const ret = await res.text();
  console.log('>> app.services.webhooks.triggerDailyHaikuSaved', { ret });

  return ret;
}

export async function triggerDailyHaikudleSaved(dailyHaikudle: DailyHaikudle) {
  const url = process.env.WEBHOOK_DAILY_HAIKUDLE_SAVED;
  console.log('>> app.services.webhooks.triggerDailyHaikudleSaved', { dailyHaikudle, url });

  if (!url) {
    console.warn(">> app.services.webhooks.triggerDailyHaikudleSaved WARNING: WEBHOOK_DAILY_HAIKUDLE_SAVED variable not set");
    return;
  }
  

  console.log('>> app.services.webhooks.triggerDailyHaikudleSaved about to test fetch 1', {});
  const test1 = await fetch("https://haiku.desmat.ca/testwebhook", {
    method: "GET",    
  });
  console.log('>> app.services.webhooks.triggerDailyHaikudleSaved', { test1 });

  console.log('>> app.services.webhooks.triggerDailyHaikudleSaved about to test fetch 2', {});
  const test2 = await fetch("https://haiku.desmat.ca/testwebhook", {
    method: "POST",    
  });
  console.log('>> app.services.webhooks.triggerDailyHaikudleSaved', { test1 });

  console.log('>> app.services.webhooks.triggerDailyHaikudleSaved about fetch for real', { url });
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(dailyHaikudle),
  });

  if (res.status != 200) {
    console.error(">> app.services.webhooks.triggerDailyHaikudleSaved ERROR", { res });
  }

  console.log('>> app.services.webhooks.triggerDailyHaikudleSaved', { res });

  // const ret = await res.json();
  // console.log('>> app.services.webhooks.triggerDailyHaikuSaved', { ret });

  const ret = await res.text();
  console.log('>> app.services.webhooks.triggerDailyHaikudleSaved', { ret });

  return ret;
}
