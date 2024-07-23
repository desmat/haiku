export type HaikuAlbum = {
  id: string,
  createdAt: number,
  createdBy: string,
  haikuIds: string[],
  updatedAt?: number,
  updatedBy?: string,  
  poemPrompt?: string,
  imagePrompt?: string, // can include ${theme} and/or ${mood}
  artStyles?: string[],
}
