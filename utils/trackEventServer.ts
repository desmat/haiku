import { TrackingEventType } from "@/types/TrackingEvent";
import { track } from '@vercel/analytics/server';

export default async function trackEvent(event: TrackingEventType, data?: any) {
  // console.log("*** utils.trackEventServer", { event, data });
  await track(event, data);
}
