export const generatePassCode = (): string => {
  // 1～999999のランダムな整数を生成し、6桁にゼロ埋め
  return Math.floor(1 + Math.random() * 999999)
    .toString()
    .padStart(6, '0');
}