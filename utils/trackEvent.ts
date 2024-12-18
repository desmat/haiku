import { TrackingEventType } from "@/types/TrackingEvent";
import { track } from '@vercel/analytics';

export default function trackEvent(event: TrackingEventType, data?: any) {
  // console.log("utils.trackEvent", { event, data });
  track(event, data);
}
