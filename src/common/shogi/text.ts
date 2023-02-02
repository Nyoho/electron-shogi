import { Color } from "./color";
import {
  HDirection,
  VDirection,
  directionToHDirection,
  directionToVDirection,
  reverseDirection,
} from "./direction";
import { Move } from "./move";
import { PieceType, Piece } from "./piece";
import { ImmutablePosition, isPromotableRank } from "./position";
import { SpecialMove } from "./record";
import { Square } from "./square";

const multiByteCharToNumberMap: { [file: string]: number } = {
  "１": 1,
  "２": 2,
  "３": 3,
  "４": 4,
  "５": 5,
  "６": 6,
  "７": 7,
  "８": 8,
  "９": 9,
};
const kanjiToNumberMap: { [kansuji: string]: number } = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
  十三: 13,
  十四: 14,
  十五: 15,
  十六: 16,
  十七: 17,
  十八: 18,
};
const charToNumberMap: { [number: string]: number } = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
};
const stringToPieceTypeMap: { [kanji: string]: PieceType } = {
  王: PieceType.KING,
  玉: PieceType.KING,
  飛: PieceType.ROOK,
  龍: PieceType.DRAGON,
  竜: PieceType.DRAGON,
  角: PieceType.BISHOP,
  馬: PieceType.HORSE,
  金: PieceType.GOLD,
  銀: PieceType.SILVER,
  成銀: PieceType.PROM_SILVER,
  全: PieceType.PROM_SILVER,
  桂: PieceType.KNIGHT,
  成桂: PieceType.PROM_KNIGHT,
  圭: PieceType.PROM_KNIGHT,
  香: PieceType.LANCE,
  成香: PieceType.PROM_LANCE,
  杏: PieceType.PROM_LANCE,
  歩: PieceType.PAWN,
  と: PieceType.PROM_PAWN,
};

export function multiByteCharToNumber(file: string): number {
  return multiByteCharToNumberMap[file];
}

export function kanjiToNumber(kanji: string): number {
  return kanjiToNumberMap[kanji];
}

export function charToNumber(char: string): number {
  return charToNumberMap[char];
}

export function stringToPieceType(piece: string): PieceType {
  return stringToPieceTypeMap[piece];
}

const kanjiNumberStrings = [
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
  "十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
];
const fileStrings = ["１", "２", "３", "４", "５", "６", "７", "８", "９"];

export function numberToKanji(n: number): string {
  return kanjiNumberStrings[n - 1];
}

export function fileToMultiByteChar(file: number): string {
  return fileStrings[file - 1];
}

export function rankToKanji(rank: number): string {
  return kanjiNumberStrings[rank - 1];
}

const pieceTypeToStringForMoveMap = {
  king: "玉",
  rook: "飛",
  dragon: "龍",
  bishop: "角",
  horse: "馬",
  gold: "金",
  silver: "銀",
  promSilver: "成銀",
  knight: "桂",
  promKnight: "成桂",
  lance: "香",
  promLance: "成香",
  pawn: "歩",
  promPawn: "と",
};

export function pieceTypeToStringForMove(pieceType: PieceType): string {
  return pieceTypeToStringForMoveMap[pieceType];
}

const pieceTypeToStringForBoardMap = {
  king: "玉",
  rook: "飛",
  dragon: "龍",
  bishop: "角",
  horse: "馬",
  gold: "金",
  silver: "銀",
  promSilver: "全",
  knight: "桂",
  promKnight: "圭",
  lance: "香",
  promLance: "杏",
  pawn: "歩",
  promPawn: "と",
};

export function pieceTypeToStringForBoard(pieceType: PieceType): string {
  return pieceTypeToStringForBoardMap[pieceType];
}

const specialMoveToDisplayStringMap = {
  start: "開始局面",
  resign: "投了",
  interrupt: "中断",
  impass: "持将棋",
  draw: "引き分け",
  repetitionDraw: "千日手",
  mate: "詰み",
  timeout: "切れ負け",
  foulWin: "反則勝ち",
  foulLose: "反則負け",
  enteringOfKing: "入玉",
  winByDefault: "不戦勝",
  lossByDefault: "不戦敗",
  sealNextMove: "封じ手",
};

export function getSpecialMoveDisplayString(move: SpecialMove): string {
  return specialMoveToDisplayStringMap[move];
}

export function getMoveDisplayText(
  position: ImmutablePosition,
  move: Move,
  opt?: {
    prev?: Move;
    compatible?: boolean;
  }
): string {
  let ret = "";

  // 手番を表す記号を付与する。
  switch (move.color) {
    case Color.BLACK:
      ret += opt?.compatible ? "▲" : "☗";
      break;
    case Color.WHITE:
      ret += opt?.compatible ? "△" : "☖";
      break;
  }

  // 移動先の筋・段を付与する。
  if (opt?.prev && opt.prev.to.equals(move.to)) {
    ret += "同　";
  } else {
    ret += fileToMultiByteChar(move.to.file);
    ret += rankToKanji(move.to.rank);
  }
  ret += pieceTypeToStringForMove(move.pieceType);
  const piece = new Piece(move.color, move.pieceType);

  // 同じマス目へ移動可能な同種の駒を列挙
  const others = position
    .listAttackersByPiece(move.to, piece)
    .filter((square) => {
      return !(move.from instanceof Square) || !square.equals(move.from);
    });
  // 移動可能な同じ駒がある場合に移動元を区別する文字を付ける。
  if (move.from instanceof Square) {
    // この指し手の移動方向
    let myDir = move.from.directionTo(move.to);
    myDir = move.color === Color.BLACK ? myDir : reverseDirection(myDir);
    const myVDir = directionToVDirection(myDir);
    const myHDir = directionToHDirection(myDir);
    // 他の駒の移動方向
    const otherDirs = others.map((square) => {
      const dir = square.directionTo(move.to);
      return move.color === Color.BLACK ? dir : reverseDirection(dir);
    });
    // 水平方向がこの指し手と同じものを列挙して、その垂直方向を保持する。
    const vDirections = otherDirs
      .filter((dir) => directionToHDirection(dir) == myHDir)
      .map((dir) => directionToVDirection(dir));
    // 垂直方向がこの指し手と同じものを列挙して、その水平方向を保持する。
    const hDirections = otherDirs
      .filter((dir) => directionToVDirection(dir) == myVDir)
      .map((dir) => directionToHDirection(dir));
    // 水平方向で区別すべき駒がある場合
    let noVertical = false;
    if (hDirections.length) {
      if (
        move.pieceType === PieceType.HORSE ||
        move.pieceType === PieceType.DRAGON
      ) {
        // 竜や馬の場合は2枚しかないので「直」は使わない。
        if (
          myHDir === HDirection.LEFT ||
          (myHDir === HDirection.NONE && hDirections[0] === HDirection.RIGHT)
        ) {
          ret += "右";
        } else if (
          myHDir === HDirection.RIGHT ||
          (myHDir === HDirection.NONE && hDirections[0] === HDirection.LEFT)
        ) {
          ret += "左";
        }
      } else {
        switch (myHDir) {
          case HDirection.LEFT:
            ret += "右";
            break;
          case HDirection.NONE:
            ret += "直";
            // 後ろへ3方向移動できてなおかつ3枚以上ある駒は存在しないため「直」と垂直方向の区別は同時に使用しない。
            noVertical = true;
            break;
          case HDirection.RIGHT:
            ret += "左";
            break;
        }
      }
    }
    // 垂直方向で区別すべき駒がある場合
    if (
      !noVertical &&
      (vDirections.length || (!hDirections.length && others.length))
    ) {
      switch (myVDir) {
        case VDirection.DOWN:
          ret += "引";
          break;
        case VDirection.NONE:
          ret += "寄";
          break;
        case VDirection.UP:
          ret += "上";
          break;
      }
    }
    // 「成」または「不成」を付ける。
    if (move.promote) {
      ret += "成";
    } else if (
      move.from instanceof Square &&
      piece.isPromotable() &&
      (isPromotableRank(move.color, move.from.rank) ||
        isPromotableRank(move.color, move.to.rank))
    ) {
      ret += "不成";
    }
  } else if (others.length) {
    // 盤上に移動可能な同じ駒がある場合は、駒台から打つことを明示する。
    ret += "打";
  }
  return ret;
}
