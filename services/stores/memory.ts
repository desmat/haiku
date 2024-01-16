
import moment from "moment";
import { mapToList, uuid } from "@/utils/misc";
import { Haiku } from "@/types/Haiku";
import { GenericStore, Store } from "@/types/Store";

type MenoryStoreEntry = {
  id?: string,
  name?: string,
  createdBy?: string,
  createdAt?: number,
  updatedAt?: number,
  updatedBy?: string,
  deletedAt?: number,
  deletedBy?: string,
}

class MemoryStore<T extends MenoryStoreEntry> implements GenericStore<T> {
  key: string;
  valueKey: (id: string) => string;
  listKey: () => string;

  store = {
    "1": {
      id: "1",
      theme: "sunset",
      bgImage: "/backgrounds/DALL·E 2024-01-09 18.43.26 - An extremely muted, almost monochromatic painting in the Japanese style, featuring a sunset. The artwork captures the serene beauty of a sunset, with .png",
      color: "rgb(32, 31, 27)",
      bgColor: "rgb(131, 127, 111)",
      poem: [
        "Fiery sunset fades,",
        "Day's last light kisses the sea,",
        "Evening's embrace.",
      ],
    },
    "2": {
      id: "2",
      theme: "cherry blossoms",
      bgImage: "/backgrounds/DALL·E 2024-01-09 18.45.07 - An extremely muted, almost monochromatic painting in the Japanese style, featuring cherry blossoms. The artwork captures the delicate beauty of cherry.png",
      color: "rgb(38, 35, 32)",
      bgColor: "rgb(153, 143, 128)",
      poem: [
        "Cherry blossoms fall,",
        "A gentle rain of petals,",
        "Spring's fleeting beauty."
      ],
    },
    "3": {
      id: "3",
      theme: "winter",
      bgImage: "/backgrounds/DALL·E 2024-01-15 17.55.09 - An extremely muted, almost monochromatic painting in the Japanese style, featuring a winter snow scene. The artwork captures the quiet beauty of a sno.png",
      color: "rgb(44, 44, 42)",
      bgColor: "rgb(176, 178, 168)",
      poem: [
        "Snow blankets the field,",
        "Silence in the winter air,",
        "Nature's hush descends.",
      ],
    },
    "4": {
      id: "4",
      theme: "Desert at dusk.",
      bgImage: "/backgrounds/DALL·E 2024-01-16 13.26.56 - An extremely muted, almost monochromatic painting in the Japanese style, depicting a desert at dusk. The artwork captures the tranquil and vast expans.png",
      color: "rgb(23, 21, 21)",
      bgColor: "rgb(92, 87, 84)",
      poem: [
        "Desert sands at dusk,",
        "Shadows stretch, the sun retreats,",
        "Silent, endless peace.",
      ],
    },
    "5": {
      id: "5",
      theme: "Mountain peaks",
      bgImage: "/backgrounds/DALL·E 2024-01-16 13.32.57 - An extremely muted, almost monochromatic painting in the Japanese style, featuring mountain peaks. The artwork captures the majestic and rugged beauty.png",
      color: "rgb(32, 31, 28)",
      bgColor: "rgb(128, 126, 114)",
      poem: [
        "Mountain peaks in mist,",
        "Ancient guardians of stone,",
        "Whispers of old earth.",
      ],
    },
    "6": {
      id: "6",
      theme: "fishing in the ocean",
      bgImage: "/backgrounds/DALL·E 2024-01-16 13.37.57 - An extremely muted, almost monochromatic painting in the Japanese style, depicting a scene of fishing in the ocean. The artwork captures a tranquil oc.png",
      color: "rgb(36, 37, 29)",
      bgColor: "rgb(147, 149, 118)",
      poem: [
        "Ocean's depth beckons,",
        "Lines cast into the blue vast,",
        "Patience meets the tide.",
      ],
    },
  };

  constructor(key: string, listKey?: string) {
    this.key = key;
    this.valueKey = (id: string) => `${key}:${id}`;
    this.listKey = () => `${listKey || key + "s"}`;
  }

  async get(id: string): Promise<T | undefined> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.get`, { id });

    throw "Not implemented";

    // const response = await kv.json.get(this.valueKey(id), "$");

    // // console.log(`>> services.stores.memory.MemoryStore<${this.key}>.get`, { response });

    // let value: T | undefined;
    // if (response) {
    //   value = response[0] as T;
    // }

    // return value;
  }

  async find(query?: any): Promise<T[]> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.find`, { query });

    return mapToList(this.store);
  }

  async create(userId: string, value: T): Promise<T> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.create`, { userId, value });

    throw "Not implemented";

    // if (!value.id) {
    //   throw `Cannot save add with null id`;
    // }

    // const createdListValue = {
    //   id: value.id || uuid(),
    //   createdAt: moment().valueOf(),
    //   createdBy: userId,
    //   name: value.name,
    // };

    // const createdValue = {
    //   ...value,
    //   ...createdListValue,
    // };

    // await checkKey(this.listKey());
    // const responses = await Promise.all([
    //   kv.json.arrappend(this.listKey(), "$", createdListValue),
    //   kv.json.set(this.valueKey(value.id), "$", createdValue),
    // ]);

    // // console.log(`>> services.stores.memory.MemoryStore<${this.key}>.create`, { responses });

    // return new Promise((resolve) => resolve(value));
  }

  async update(userId: string, value: T): Promise<T> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.update`, { value });

    throw "Not implemented";

    // if (!value.id) {
    //   throw `Cannot update ${this.key}: null id`;
    // }

    // if (!this.get(value.id)) {
    //   throw `Cannot update ${this.key}: does not exist: ${value.id}`;
    // }

    // const updatedValue = { ...value, updatedAt: moment().valueOf(), updatedBy: userId }
    // const response = await Promise.all([
    //   kv.json.set(this.listKey(), `${jsonGetBy("id", value.id)}.updatedAt`, updatedValue.updatedAt),
    //   kv.json.set(this.listKey(), `${jsonGetBy("id", value.id)}.updatedBy`, `"${updatedValue.updatedBy}"`),
    //   kv.json.set(this.valueKey(value.id), "$", updatedValue),
    // ]);

    // // console.log(`>> services.stores.memory.MemoryStore<${this.key}>.update`, { response });

    // return new Promise((resolve) => resolve(updatedValue));
  }

  async delete(userId: string, id: string): Promise<T> {
    console.log(`>> services.stores.memory.MemoryStore<${this.key}>.delete`, { id });

    throw "Not implemented";

    // if (!id) {
    //   throw `Cannot delete ${this.key}: null id`;
    // }

    // const value = await this.get(id)
    // if (!value) {
    //   throw `Cannot update ${this.key}: does not exist: ${id}`;
    // }

    // value.deletedAt = moment().valueOf();
    // const response = await Promise.all([
    //   kv.json.set(this.listKey(), `${jsonGetBy("id", id)}.deletedAt`, value.deletedAt),
    //   kv.json.set(this.listKey(), `${jsonGetBy("id", id)}.deletedBy`, `"${userId}"`),
    //   kv.json.del(this.valueKey(id), "$")
    // ]);

    // // console.log(`>> services.stores.memory.MemoryStore<${this.key}>.delete`, { response });

    // return new Promise((resolve) => resolve(value));
  }
}

export function create(): Store {
  return {
    haikus: new MemoryStore<Haiku>("haiku"),
  }
}
