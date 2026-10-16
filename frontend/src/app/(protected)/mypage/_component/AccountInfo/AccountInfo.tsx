"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import { clearAuthToken } from "@/api/domain/auth/Auth.action";
import { UserMutation } from "@/api/domain/user/User.mutation";
import { UserQuery } from "@/api/domain/user/User.query";
import type { getMeResponse } from "@/api/domain/user/getMe/response/getMeRes";
import {
  updateEmailRequestSchema,
  type UpdateEmailRequest,
} from "@/api/domain/user/updateEmail/request/UpdateEmailReq";
import type { UpdateEmailResponse } from "@/api/domain/user/updateEmail/response/UpdateEmailRes";
import {
  updateNicknameRequestSchema,
  type UpdateNicknameRequest,
} from "@/api/domain/user/updateNickname/request/UpdateNicknameReq";
import type { UpdateNicknameResponse } from "@/api/domain/user/updateNickname/response/UpdateNicknameRes";
import {
  updatePasswordRequestSchema,
  type UpdatePasswordFormValues,
  type UpdatePasswordRequest,
} from "@/api/domain/user/updatePassword/request/UpdatePasswordReq";
import type {
  UpdateEmailErrorResponse,
  UpdateNicknameErrorResponse,
  UpdatePasswordErrorResponse,
} from "@/api/domain/user/User.error";
import InputBox from "@/components/InputBox";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./AccountInfo.module.css";

const cx = bindClassNames(styles);

type AccountInfoProps = {
  initialMe: getMeResponse;
};

export default function AccountInfo({ initialMe }: AccountInfoProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: me } = useQuery({
    queryKey: UserQuery.getMeQueryKey,
    queryFn: () => UserQuery.getMe(),
    initialData: initialMe,
  });

  const invalidateMe = () =>
    queryClient.invalidateQueries({ queryKey: UserQuery.getMeQueryKey });

  // ================= 닉네임 =================
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const {
    register: registerNickname,
    handleSubmit: handleNicknameSubmit,
    reset: resetNicknameForm,
    formState: { errors: nicknameErrors, isValid: isNicknameValid },
  } = useForm<UpdateNicknameRequest>({
    resolver: zodResolver(updateNicknameRequestSchema),
    mode: "onChange",
  });

  const {
    mutate: submitNickname,
    isPending: isNicknamePending,
    error: nicknameServerError,
  } = useMutation<
    UpdateNicknameResponse,
    UpdateNicknameErrorResponse,
    UpdateNicknameRequest
  >({
    mutationFn: UserMutation.patchNickname,
    onSuccess: () => {
      invalidateMe();
      setIsEditingNickname(false);
      toast.success("닉네임을 변경했어요.");
    },
  });

  const startNicknameEdit = () => {
    resetNicknameForm({ nickname: me.nickname });
    setIsEditingNickname(true);
  };

  // ================= 이메일 =================
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    reset: resetEmailForm,
    formState: { errors: emailErrors, isValid: isEmailValid },
  } = useForm<UpdateEmailRequest>({
    resolver: zodResolver(updateEmailRequestSchema),
    mode: "onChange",
  });

  const {
    mutate: submitEmail,
    isPending: isEmailPending,
    error: emailServerError,
  } = useMutation<
    UpdateEmailResponse,
    UpdateEmailErrorResponse,
    UpdateEmailRequest
  >({
    mutationFn: UserMutation.patchEmail,
    onSuccess: async () => {
      // 이메일이 토큰 subject라 기존 세션이 더 이상 유효하지 않다 — 새 토큰을 발급해
      // 계속 로그인 상태를 유지하는 대신, 세션을 정리하고 새 이메일로 다시 로그인하게 한다.
      await clearAuthToken();
      queryClient.setQueryData(UserQuery.getMeQueryKey, null);
      toast.success("이메일을 변경했어요. 새 이메일로 다시 로그인해주세요.");
      router.push("/auth/login");
    },
  });

  const startEmailEdit = () => {
    resetEmailForm({ email: me.email });
    setIsEditingEmail(true);
  };

  // ================= 비밀번호 =================
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isValid: isPasswordValid },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordRequestSchema),
    mode: "onChange",
  });

  const {
    mutate: submitPassword,
    isPending: isPasswordPending,
    error: passwordServerError,
  } = useMutation<null, UpdatePasswordErrorResponse, UpdatePasswordRequest>({
    mutationFn: UserMutation.patchPassword,
    onSuccess: () => {
      setIsEditingPassword(false);
      resetPasswordForm();
      toast.success("비밀번호를 변경했어요.");
    },
  });

  const startPasswordEdit = () => {
    resetPasswordForm();
    setIsEditingPassword(true);
  };

  const onPasswordSubmit = (data: UpdatePasswordFormValues) =>
    submitPassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

  // ================= 마케팅 수신 동의 =================
  const { mutate: submitMarketingAgree, isPending: isMarketingPending } =
    useMutation({
      mutationFn: UserMutation.patchMarketingAgree,
      onSuccess: () => invalidateMe(),
    });

  // ================= 회원 탈퇴 =================
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
  const { mutate: submitWithdraw, isPending: isWithdrawPending } = useMutation<
    null,
    ApiErrorResponse
  >({
    mutationFn: UserMutation.deleteMe,
    onSuccess: async () => {
      await clearAuthToken();
      queryClient.setQueryData(UserQuery.getMeQueryKey, null);
      toast.success("회원 탈퇴가 완료됐어요.");
      router.push("/auth/login");
    },
    onError: () => {
      toast.error("탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요.");
    },
  });

  return (
    <div className={cx("wrapper")}>
      <div className={cx("card")}>
        {/* 이메일 */}
        {isEditingEmail ? (
          <form
            className={cx("editForm")}
            onSubmit={handleEmailSubmit((data) => submitEmail(data))}
            noValidate
          >
            <InputBox
              id="email"
              type="email"
              label="이메일"
              autoComplete="email"
              error={emailErrors.email?.message ?? emailServerError?.message}
              {...registerEmail("email")}
            />
            <div className={cx("editActions")}>
              <button
                type="button"
                className={cx("btnSm")}
                onClick={() => setIsEditingEmail(false)}
              >
                취소
              </button>
              <button
                type="submit"
                className={cx("btnPrimarySm")}
                disabled={!isEmailValid || isEmailPending}
              >
                {isEmailPending ? "저장 중…" : "저장"}
              </button>
            </div>
          </form>
        ) : (
          <div className={cx("row")}>
            <span className={cx("rowLabel")}>이메일</span>
            <span className={cx("rowValue")}>{me.email}</span>
            <span className={cx("badgeOk")}>인증됨</span>
            <button
              type="button"
              className={cx("btnSm")}
              onClick={startEmailEdit}
            >
              수정
            </button>
          </div>
        )}

        {/* 닉네임 */}
        {isEditingNickname ? (
          <form
            className={cx("editForm")}
            onSubmit={handleNicknameSubmit((data) => submitNickname(data))}
            noValidate
          >
            <InputBox
              id="nickname"
              type="text"
              label="닉네임"
              autoComplete="nickname"
              help="한글·영문·숫자 2~12자"
              error={
                nicknameErrors.nickname?.message ?? nicknameServerError?.message
              }
              {...registerNickname("nickname")}
            />
            <div className={cx("editActions")}>
              <button
                type="button"
                className={cx("btnSm")}
                onClick={() => setIsEditingNickname(false)}
              >
                취소
              </button>
              <button
                type="submit"
                className={cx("btnPrimarySm")}
                disabled={!isNicknameValid || isNicknamePending}
              >
                {isNicknamePending ? "저장 중…" : "저장"}
              </button>
            </div>
          </form>
        ) : (
          <div className={cx("row")}>
            <span className={cx("rowLabel")}>닉네임</span>
            <span className={cx("rowValue")}>{me.nickname}</span>
            <button
              type="button"
              className={cx("btnSm")}
              onClick={startNicknameEdit}
            >
              수정
            </button>
          </div>
        )}

        {/* 비밀번호 */}
        {isEditingPassword ? (
          <form
            className={cx("editForm")}
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            noValidate
          >
            <InputBox
              id="currentPassword"
              type="password"
              label="현재 비밀번호"
              autoComplete="current-password"
              error={
                passwordErrors.currentPassword?.message ??
                passwordServerError?.message
              }
              {...registerPassword("currentPassword")}
            />
            <InputBox
              id="newPassword"
              type="password"
              label="새 비밀번호"
              autoComplete="new-password"
              help="영문·숫자·특수문자 조합 8~16자"
              error={passwordErrors.newPassword?.message}
              {...registerPassword("newPassword")}
            />
            <InputBox
              id="newPasswordConfirm"
              type="password"
              label="새 비밀번호 확인"
              autoComplete="new-password"
              error={passwordErrors.newPasswordConfirm?.message}
              {...registerPassword("newPasswordConfirm")}
            />
            <div className={cx("editActions")}>
              <button
                type="button"
                className={cx("btnSm")}
                onClick={() => setIsEditingPassword(false)}
              >
                취소
              </button>
              <button
                type="submit"
                className={cx("btnPrimarySm")}
                disabled={!isPasswordValid || isPasswordPending}
              >
                {isPasswordPending ? "변경 중…" : "변경하기"}
              </button>
            </div>
          </form>
        ) : (
          <div className={cx("row")}>
            <span className={cx("rowLabel")}>비밀번호</span>
            <span className={cx("rowValue")}>••••••••</span>
            <button
              type="button"
              className={cx("btnSm")}
              onClick={startPasswordEdit}
            >
              변경
            </button>
          </div>
        )}
      </div>

      <div className={cx("card")}>
        <div className={cx("row")}>
          <span className={cx("rowValue")}>마케팅 정보 수신 동의</span>
          <button
            type="button"
            role="switch"
            aria-checked={me.marketingAgree}
            aria-label="마케팅 정보 수신 동의"
            disabled={isMarketingPending}
            className={cx("toggleTrack", { toggleOn: me.marketingAgree })}
            onClick={() =>
              submitMarketingAgree({ marketingAgree: !me.marketingAgree })
            }
          >
            <span className={cx("toggleKnob")} />
          </button>
        </div>
      </div>

      <div className={cx("withdrawArea")}>
        {isWithdrawConfirmOpen ? (
          <div
            className={cx("withdrawBox")}
            role="alertdialog"
            aria-label="회원 탈퇴 확인"
          >
            <p className={cx("withdrawTitle")}>정말 탈퇴하시겠어요?</p>
            <p className={cx("withdrawDesc")}>
              회원 정보는 즉시 삭제되며 복구할 수 없어요.
            </p>
            <div className={cx("withdrawActions")}>
              <button
                type="button"
                className={cx("btnSm")}
                onClick={() => setIsWithdrawConfirmOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className={cx("btnDanger")}
                disabled={isWithdrawPending}
                onClick={() => submitWithdraw()}
              >
                {isWithdrawPending ? "처리 중…" : "탈퇴하기"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={cx("withdrawTrigger")}
            onClick={() => setIsWithdrawConfirmOpen(true)}
          >
            계정을 삭제하고 싶으신가요? 회원 탈퇴
          </button>
        )}
      </div>
    </div>
  );
}
