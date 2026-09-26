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
   * 漢字を読みに直したもの（読めないところはそのまま）。ファイル名を作るのに使う。
   * 漢字が無いとき、または辞書が読み込めなかったときは null（入力をそのままローマ字にする）
   */
  name: string | null;
  /**
   * 読みの欄に入れるもの。読めるところはひらがなにし、英字・記号などはそのまま残す。
   * 読めないところが残っていても入れる（要らなければ申請する人が消す）
   */
  ruby: string;
};

/**
 * 入力した文字から読みを推測する。改行と空白は取り除く。
 * 漢字が無いときは辞書を読み込まず、かなをひらがなにしただけのものを返す。
 * 空のときだけ null を返す。
 */
export async function guessReading(content: string): Promise<Reading | null> {
  const text = content.replace(/[\s\u3000]/g, "");
  if (!text) return null;
  const plain: Reading = { name: null, ruby: kanaToHira(text) };
  if (!HAS_KANJI.test(text)) return plain;

  let tokenizer: Tokenizer<IpadicFeatures>;
  try {
    tokenizer = await getTokenizer();
  } catch {
    return plain;
  }

  const joined = tokenizer.tokenize(text).map((token) => {
    const surface = token.surface_form;
    // かなはそのまま使う（辞書の読みだと表記が変わることがあるため）
    if (KANA_ONLY.test(surface)) return kanaToHira(surface);
    if (token.reading && token.reading !== "*" && KANA_ONLY.test(token.reading)) {
      return kanaToHira(token.reading);
    }
    return surface;
  }).join("");
  return { name: joined, ruby: joined };
}
