import { useState } from "react";
import { ShieldCheck, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PackageTermsConsentProps {
  agreed: boolean;
  onAgreeChange: (checked: boolean) => void;
  role?: "tenant" | "landlord";
}

export function PackageTermsConsent({
  agreed,
  onAgreeChange,
  role = "tenant",
}: PackageTermsConsentProps) {
  const [openModal, setOpenModal] = useState(false);
  const isLandlord = role === "landlord";

  return (
    <>
      <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-xs text-slate-700">
        <Checkbox
          id={`package-terms-consent-${role}`}
          checked={agreed}
          onCheckedChange={(v) => onAgreeChange(Boolean(v))}
          className="mt-0.5 cursor-pointer"
        />
        <label htmlFor={`package-terms-consent-${role}`} className="leading-relaxed cursor-pointer select-none">
          Tôi đã đọc và đồng ý với{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpenModal(true);
            }}
            className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800 cursor-pointer"
          >
            {isLandlord
              ? "Điều khoản gói dịch vụ Chủ trọ & Quy định đăng tin"
              : "Điều khoản gói dịch vụ Người thuê & Quy định ghép bạn"}
          </button>{" "}
          {isLandlord
            ? "(bao gồm quy định ẩn tin đăng, hủy lượt đẩy tin và không hoàn phí nếu tài khoản vi phạm từ 3 lần trở lên)."
            : "(bao gồm quy định tạm dừng đẩy hồ sơ, khóa tính năng ghép đôi và không hoàn phí nếu tài khoản vi phạm từ 3 lần trở lên)."}
        </label>
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[540px] max-h-[calc(100dvh-5rem)] p-0 overflow-hidden rounded-2xl border bg-card shadow-2xl flex flex-col gap-0">
          <DialogHeader className="shrink-0 px-5 pt-4 pb-3 border-b bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 pr-6">
              <FileText className="size-4 text-emerald-600 shrink-0" />
              {isLandlord
                ? "Điều khoản gói dịch vụ Chủ trọ & Quy định đăng tin"
                : "Điều khoản gói dịch vụ Người thuê & Quy định ghép bạn"}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-500">
              {isLandlord
                ? "Quy định minh bạch dành riêng cho Chủ trọ khi mua lượt đẩy tin ưu tiên và đăng phòng cho thuê."
                : "Quy định minh bạch dành riêng cho Người thuê khi mua gói mở rộng lượt quẹt và đẩy hồ sơ tìm bạn ở ghép."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-3 space-y-2.5 text-xs text-slate-700 leading-snug">
            <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-200/70">
              <p className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-700 shrink-0" />
                {isLandlord
                  ? "1. Quy trình xử lý vi phạm 3 cấp độ (Đối với Chủ trọ)"
                  : "1. Quy trình xử lý vi phạm 3 cấp độ (Đối với Người thuê)"}
              </p>
              {isLandlord ? (
                <ul className="space-y-1 pl-1 text-slate-700">
                  <li>
                    • <strong>Vi phạm lần 1 (Nhắc nhở):</strong> Ẩn tin đăng phòng sai quy định (nếu có), trừ 15 điểm uy tín và gửi thông báo nhắc nhở.
                  </li>
                  <li>
                    • <strong>Vi phạm lần 2 (Cảnh báo nghiêm khắc):</strong> Ẩn tin phòng vi phạm, trừ 25 điểm uy tín và <strong>tắt hiệu ứng Đẩy tin ưu tiên (7 ngày)</strong> của các phòng đang hoạt động.
                  </li>
                  <li>
                    • <strong>Vi phạm lần 3 (Ngừng cung cấp dịch vụ):</strong> Khóa tài khoản chủ trọ, <strong>ẩn toàn bộ tin đăng phòng đang hiển thị</strong> và đưa điểm uy tín về 0.
                  </li>
                </ul>
              ) : (
                <ul className="space-y-1 pl-1 text-slate-700">
                  <li>
                    • <strong>Vi phạm lần 1 (Nhắc nhở):</strong> Gỡ lời giới thiệu hồ sơ hoặc đóng tin sang nhượng phòng vi phạm (nếu có), trừ 15 điểm uy tín và gửi thông báo nhắc nhở.
                  </li>
                  <li>
                    • <strong>Vi phạm lần 2 (Cảnh báo nghiêm khắc):</strong> Trừ 25 điểm uy tín và <strong>tạm dừng hiệu ứng Đẩy hồ sơ tìm bạn ưu tiên (24 giờ)</strong> đang sử dụng.
                  </li>
                  <li>
                    • <strong>Vi phạm lần 3 (Ngừng cung cấp dịch vụ):</strong> Khóa tài khoản người thuê, <strong>ẩn hồ sơ khỏi danh sách ghép đôi tìm bạn</strong> và đưa điểm uy tín về 0.
                  </li>
                </ul>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900">
                {isLandlord
                  ? "2. Chính sách kích hoạt & hoàn phí đối với lượt đẩy tin (Chủ trọ)"
                  : "2. Chính sách kích hoạt & hoàn phí đối với gói ghép đôi (Người thuê)"}
              </p>
              {isLandlord ? (
                <>
                  <p>
                    Các <strong>lượt đẩy tin phòng trọ ưu tiên</strong> được cộng trực tiếp vào tài khoản chủ trọ ngay sau khi thanh toán thành công và không giới hạn thời gian lưu trữ đối với lượt chưa dùng.
                  </p>
                  <p>
                    Trong trường hợp tài khoản chủ trọ bị khóa do vi phạm đến lần thứ 3 (<strong>đăng phòng ảo, sử dụng hình ảnh không đúng thực tế, thu sai giá thuê/phí dịch vụ đã cam kết hoặc giữ tiền cọc trái thỏa thuận</strong>), Phòng Trọ Xanh có quyền đơn phương chấm dứt cung cấp dịch vụ và <strong>không hoàn lại phí các gói hoặc lượt đẩy tin đã mua</strong>.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Các quyền lợi dành cho người thuê (<strong>mở rộng lượt quẹt mỗi ngày, lượt đẩy hồ sơ tìm bạn ở ghép ưu tiên 24 giờ</strong>) được kích hoạt và cộng trực tiếp vào tài khoản ngay sau khi thanh toán thành công.
                  </p>
                  <p>
                    Trong trường hợp tài khoản người thuê bị khóa do vi phạm đến lần thứ 3 (<strong>khai báo danh tính/hồ sơ giả mạo, quấy rối hoặc gửi tin nhắn phản cảm cho thành viên khác, spam kết nối hoặc gian lận khi thỏa thuận ở ghép/đổi phòng</strong>), Phòng Trọ Xanh có quyền đơn phương chấm dứt cung cấp dịch vụ và <strong>không hoàn lại phí gói dịch vụ đã mua hoặc đang còn hạn</strong>.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900">3. Căn cứ pháp lý áp dụng</p>
              <p>
                Quy định này được áp dụng theo <strong>Điều 423 và Điều 428 Bộ luật Dân sự 2015</strong> (về hủy bỏ và đơn phương chấm dứt thực hiện hợp đồng do vi phạm nghiêm trọng nghĩa vụ) cùng <strong>Nghị định 52/2013/NĐ-CP (sửa đổi, bổ sung bởi Nghị định 85/2021/NĐ-CP)</strong> về trách nhiệm cung cấp thông tin trung thực trên nền tảng thương mại điện tử.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900">4. Quyền phản hồi và khiếu nại</p>
              <p>
                Mọi báo cáo vi phạm đều được kiểm tra đối chiếu bằng chứng trước khi xử lý. Thành viên có quyền gửi phản hồi kèm minh chứng thực tế trong vòng 07 ngày kể từ khi nhận thông báo để được xem xét khôi phục quyền lợi.
              </p>
            </div>
          </div>

          <DialogFooter className="shrink-0 px-5 py-3 bg-slate-50/80 border-t gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)} className="text-xs">
              Đóng
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={() => {
                onAgreeChange(true);
                setOpenModal(false);
              }}
            >
              Tôi đã hiểu và đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
