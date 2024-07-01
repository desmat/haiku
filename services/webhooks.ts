import { DailyHaiku, Haiku } from "@/types/Haiku";
import { DailyHaikudle } from "@/types/Haikudle";

export async function triggerLimerickShared(haiku: Haiku) {
  console.log('>> app.services.webhooks.triggerLimerickShared', { haiku });

  const url = process.env.WEBHOOK_LIMERICK_SHARED;
  if (!url) return;
  
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(haiku),
  });

  if (res.status != 200) {
    console.error(">> app.services.webhooks.triggerLimerickShared ERROR", { res });
    return false;
  }

  console.log('>> app.services.webhooks.triggerLimerickShared', { res });

  // const ret = await res.json();
  // console.log('>> app.services.webhooks.triggerLimerickShared', { ret });

  const ret = await res.text();
  console.log('>> app.services.webhooks.triggerLimerickShared', { ret });

  return true;
}

export async function triggerDailyHaikuSaved(dailyHaiku: DailyHaiku) {
  console.log('>> app.services.webhooks.triggerDailyHaikuSaved', { dailyHaiku });

  const url = process.env.WEBHOOK_DAILY_HAIKU_SAVED;
  if (!url) return;
  
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
  console.log('>> app.services.webhooks.triggerDailyHaikudleSaved', { dailyHaikudle });

  const url = process.env.WEBHOOK_DAILY_HAIKUDLE_SAVED;
  if (!url) return;
  
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
