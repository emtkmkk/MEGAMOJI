import type { IpadicFeatures, Tokenizer } from "kuromoji";
import { kanaToHira } from "./jaToRoomaji";

/** 辞書を置く場所（ページからの相対パス。ビルド時に dist/dict へコピーする） */
const DIC_PATH = "dict/";

const KANA_ONLY = /^[ぁ-んァ-ンー]+$/;
const HAS_KANJI = /[\u3400-\u9FFF\uF900-\uFAFF々〆ヶ]/;

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

/** 形態素解析器を読み込む。辞書が大きい（約 18MB）ので、漢字が出てきたときに初めて読み込む */
function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!tokenizerPromise) {
    tokenizerPromise = import(/* webpackChunkName: "kuromoji" */ "kuromoji")
      .then((kuromoji) => new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
        kuromoji.builder({ dicPath: DIC_PATH }).build((err, tokenizer) => {
          if (err) reject(err);
          else resolve(tokenizer);
        });
      }))
      .catch((err) => {
        // 次に呼ばれたときにもう一度読み込めるようにする
        tokenizerPromise = null;
        throw err;
      });
  }
  return tokenizerPromise;
}

export type Reading = {
  /**
   * 読めるところを読みにし、読めないところ（英字・記号など）はそのまま残したもの。
   * ファイル名を作るのに使う
   */
  text: string;
  /** すべてひらがなにできたときだけ、そのひらがな。読みの欄に入れる */
  ruby: string | null;
};

/**
 * 入力した文字から読みを推測する。改行と空白は取り除く。
 * かなだけのときは辞書を読み込まずにそのまま返す。漢字が無く読みようがないときは null を返す。
 * 辞書が読み込めないときも null を返す。
 */
export async function guessReading(content: string): Promise<Reading | null> {
  const text = content.replace(/[\s\u3000]/g, "");
  if (!text) return null;
  if (KANA_ONLY.test(text)) {
    const ruby = kanaToHira(text);
    return { text: ruby, ruby };
  }
  if (!HAS_KANJI.test(text)) return null;

  let tokenizer: Tokenizer<IpadicFeatures>;
  try {
    tokenizer = await getTokenizer();
  } catch {
    return null;
  }

  let complete = true;
  const parts = tokenizer.tokenize(text).map((token) => {
    const surface = token.surface_form;
    // かなはそのまま使う（辞書の読みだと表記が変わることがあるため）
    if (KANA_ONLY.test(surface)) return kanaToHira(surface);
    if (token.reading && token.reading !== "*" && KANA_ONLY.test(token.reading)) {
      return kanaToHira(token.reading);
    }
    complete = false;
    return surface;
  });
  const joined = parts.join("");
  return { text: joined, ruby: complete ? joined : null };
}
