import { DailyHaiku, Haiku } from "@/types/Haiku";
import { DailyHaikudle } from "@/types/Haikudle";

export async function triggerHaikuSaved(haiku: Haiku) {
  const url = process.env.WEBHOOK_HAIKU_CREATED;
  console.log('app.services.webhooks.triggerHaikuCreated', { haiku, url });

  if (!url) {
    console.warn(">> app.services.webhooks.triggerHaikuCreated WARNING: WEBHOOK_HAIKU_CREATED variable not set");
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(haiku),
  });

  if (res.status != 200) {
    console.error(">> app.services.webhooks.triggerHaikuCreated ERROR", { res });
  }

  // console.log('app.services.webhooks.triggerHaikuCreated', { res });

  // const ret = await res.json();
  // console.log('app.services.webhooks.triggerHaikuCreated', { ret });

  const ret = await res.text();
  console.log('app.services.webhooks.triggerHaikuCreated', { ret });

  return ret;
}

export async function triggerDailyHaikuSaved(dailyHaiku: DailyHaiku) {
  const url = process.env.WEBHOOK_DAILY_HAIKU_SAVED;
  console.log('app.services.webhooks.triggerDailyHaikuSaved', { dailyHaiku, url });

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

  // console.log('app.services.webhooks.triggerDailyHaikuSaved', { res });

  // const ret = await res.json();
  // console.log('app.services.webhooks.triggerDailyHaikuSaved', { ret });

  const ret = await res.text();
  console.log('app.services.webhooks.triggerDailyHaikuSaved', { ret });

  return ret;
}

export async function triggerDailyHaikudleSaved(dailyHaikudle: DailyHaikudle) {
  const url = process.env.WEBHOOK_DAILY_HAIKUDLE_SAVED;
  console.log('app.services.webhooks.triggerDailyHaikudleSaved', { dailyHaikudle, url });

  if (!url) {
    console.warn(">> app.services.webhooks.triggerDailyHaikudleSaved WARNING: WEBHOOK_DAILY_HAIKUDLE_SAVED variable not set");
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(dailyHaikudle),
  });

  if (res.status != 200) {
    console.error(">> app.services.webhooks.triggerDailyHaikudleSaved ERROR", { res });
  }

  // console.log('app.services.webhooks.triggerDailyHaikudleSaved', { res });

  // const ret = await res.json();
  // console.log('app.services.webhooks.triggerDailyHaikudleSaved', { ret });

  const ret = await res.text();
  console.log('app.services.webhooks.triggerDailyHaikudleSaved', { ret });

  return ret;
}

export async function triggerHaikuShared(haiku: Haiku) {
  const url = process.env.WEBHOOK_HAIKU_SHARED;
  console.log('app.services.webhooks.triggerHaikuShared', { haiku, url });

  if (!url) {
    console.warn(">> app.services.webhooks.triggerHaikuShared WARNING: WEBHOOK_HAIKU_SHARED variable not set");
    return;
  }
  
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(haiku),
  });

  if (res.status != 200) {
    console.error(">> app.services.webhooks.triggerHaikuShared ERROR", { res });
    return false;
  }

  // console.log('app.services.webhooks.triggerHaikuShared', { res });

  // const ret = await res.json();
  // console.log('app.services.webhooks.triggerHaikuShared', { ret });

  const ret = await res.text();
  console.log('app.services.webhooks.triggerHaikuShared', { ret });

  return true;
}
