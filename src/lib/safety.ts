export const MAX_RECORDING_SECONDS = 30;
export type AlertRisk = "SAFE" | "SUSPICIOUS" | "DANGEROUS" | "UNKNOWN";
export function voiceWarning(risk: AlertRisk, phone?: string) {
  if (risk === "SUSPICIOUS") return "Bạn ơi, cẩn thận lừa đảo! Mức độ rủi ro trung bình. Hãy kiểm tra kỹ thông tin người gọi trước khi thực hiện giao dịch.";
  if (risk === "DANGEROUS") return `Bạn ơi, cẩn thận lừa đảo! Mức độ rủi ro cao. Hãy kết nối ngay với người thân${phone ? ` qua số điện thoại ${phone}` : ""} để không bị mất tiền!`;
  return "";
}
export function emitRiskAlert(risk: AlertRisk, simulated = false) {
  window.dispatchEvent(new CustomEvent("verisafe:risk", { detail: { risk, simulated } }));
}
export const DEMO_RESULTS = {
  image: { score: 68, indicators: ["Ví dụ: đường viền vành tai không đồng nhất", "Ví dụ: ánh sáng ở hai bên khuôn mặt lệch nhau", "Ví dụ: vùng da và mắt thiếu chi tiết"] },
  audio: { score: 72, indicators: ["Ví dụ: nhịp điệu lặp lại quá đều", "Ví dụ: tiếng thở giữa câu không tự nhiên", "Ví dụ: chuyển tiếp âm sắc đột ngột"] },
};
// Replace this adapter only when a validated detection service is connected.
export async function simulateMediaCheck(kind: "image" | "audio") {
  await new Promise(resolve => setTimeout(resolve, 900));
  return { ...DEMO_RESULTS[kind], simulated: true as const };
}