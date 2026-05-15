import './Modal.scoped.css';
import { type FC, useEffect, useRef, useState } from 'react';
import Portal from '../Protal';
import { isInApp, navigateBack } from '/src/native';

interface IModal<P> extends FC {
    show: (data?: P, onClickOutsideModal?: () => void) => void;
    hide: () => void;
}

export default function createModal<P>(Content: FC<P>, isBlocking: boolean = false) {
    const Modal: IModal<P> = () => {
        const [visible, setVisible] = useState(false);
        const [props, setProps] = useState<P>();
        const onClickOutsideModalRef = useRef<(() => void) | undefined>();
        const scrollYRef = useRef(0);

        function escFunction(event: any) {
            if (event.key === 'Escape') {
                Modal.hide();
            }
        }

        function goBack() {
            if (isInApp) {
                navigateBack({ forceClose: false });
            } else {
                window.history.back();
            }
        }

        // Prevent scrolling on modal
        useEffect(() => {
            if (visible) {
                // Record the current scroll position
                scrollYRef.current = window.scrollY;

                // Prevent scrolling by setting body styles
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.top = `-${scrollYRef.current}px`;
                document.body.style.width = '100%';
            } else {
                // Restore scrolling by resetting body styles
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';

                // Scroll back to the previous position
                window.scrollTo(0, scrollYRef.current);
            }
        }, [visible]);

        useEffect(() => {
            return () => {
                window.document.body.style.overflow = 'auto';
                window.document.body.style.height = window.document.documentElement.style.height = 'auto';
            };
        }, []);

        useEffect(() => {
            Modal.show = (data, onClickOutsideModal) => {
                const pageElement = document.getElementById('pageId');
                pageElement?.classList.add('fixed');
                setProps(data);
                onClickOutsideModalRef.current = onClickOutsideModal;
                setTimeout(() => setVisible(true), 10);
            };
            Modal.hide = () => {
                //conditional statement to handle blocking and non blocking modals.
                console.log(isBlocking);
                if (isBlocking) {
                    goBack();
                } else {
                    const pageElement = document.getElementById('pageId');
                    pageElement?.classList.remove('fixed');
                    setVisible(false);
                    onClickOutsideModalRef.current?.();
                }
                onClickOutsideModalRef.current = undefined;
            };
            document.addEventListener('keydown', escFunction, false);
            return () => {
                document.removeEventListener('keydown', escFunction, false);
            };
        }, []);

        return props ? (
            <Portal>
                <div
                    className={`mask ${visible ? 'show' : 'hide'}`}
                    onClick={() => Modal.hide()}
                    onTransitionEnd={() => !visible && setProps(undefined)}
                >
                    <div className="content min-h-screen flex justify-center items-center">
                        <div onClick={(e) => e.stopPropagation()}>
                            <Content {...props} />
                        </div>
                    </div>
                </div>
            </Portal>
        ) : null;
    };

    Modal.show = () => {
        throw new Error(`Modal尚未挂载`);
    };

    Modal.hide = () => {
        throw new Error(`Modal尚未挂载`);
    };

    return Modal;
}
