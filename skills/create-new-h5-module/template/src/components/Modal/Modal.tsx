import "./Modal.scoped.scss";
import { type ReactNode } from "react";
import createModal from "/src/common/createModal/createModal";

type ModalProps = {
  title?: string;
  children: ReactNode;
};

function Modal(props: ModalProps) {
  const { title, children } = props;
  return (
    <div className="w-[365px]">
      {title && <span className="">{title}</span>}
      {children}
    </div>
  );
}

export const BlockingModal = createModal(Modal, true);
export const NonBlockingModal = createModal(Modal, false);
