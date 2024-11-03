import { RedisStoreRecord } from "@desmat/redis-store";

export type HaikuAlbum = {
  haikuIds: string[],
  poemPrompt?: string,
  imagePrompt?: string, // can include ${theme} and/or ${mood}
  artStyles?: string[],
  createdBy: string,
  updatedBy?: string,
} & RedisStoreRecord;
