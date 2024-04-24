'use client'

import moment from 'moment';
import { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { MdCelebration } from "react-icons/md";
import { MdOutlineCelebration } from "react-icons/md";
import useAlert, { CustomAction } from '@/app/_hooks/alert';
import { AlertType } from '@/types/Alert';

// from https://tailwindui.com/components/application-ui/feedback/alerts

function TypedAlert({
  message,
  type,
  style,
  closed,
  handleClose,
  closeLabel,
  customActions,
}: {
  message: string,
  type: AlertType,
  style?: any
  closed: boolean,
  handleClose: any,
  closeLabel?: string,
  customActions?: any
}) {
  // console.log('>> app._components.Alert.Alert.render()', { message, type, closed, style });
  let icon: any;
  let colorClasses: any;

  switch (type) {
    case 'error':
      icon = undefined //<ExclamationTriangleIcon className={`h-5 w-5 text-red-400`} aria-hidden="true" />
      colorClasses = [
        'bg-red-50',
        '_hover:bg-red-100',
        '_active:bg-red-200',
        'text-red-800',
        'text-red-800',
        // 'border-red-100',
      ];
      break;
    case "warning":
      icon = undefined //<ExclamationCircleIcon className={`h-5 w-5 text-yellow-400`} aria-hidden="true" />
      colorClasses = [
        'bg-yellow-50',
        '_hover:bg-yellow-100',
        '_active:bg-yellow-100',
        'text-yellow-800',
        'text-yellow-800',
        // 'border-yellow-200',
      ];
      break;
    case "success":
      icon = undefined //<MdCelebration className={`h-5 w-5 text-[#6d6d6d]`} aria-hidden="true" />
      colorClasses = [
        'bg-[#f8f8f8]',
        '_hover:bg-black-100',
        '_active:bg-black-200',
        'text-[#6d6d6d]',
        'text-[#6d6d6d]',
        // 'border-green-100',
      ];
      break;
    case "info":
      icon = undefined //<InformationCircleIcon className={`h-5 w-5 text-blue-400`} aria-hidden="true" />
      colorClasses = [
        'bg-blue-50',
        '_hover:bg-blue-100',
        '_active:bg-blue-200',
        'text-blue-800',
        'text-blue-800',
        // 'border-blue-100'
      ];
      break;
    default: //case "info":
      icon = undefined;
      colorClasses = [
        'bg-[#f8f8f8]',
        '_hover:text-black',
        '_active:text-black',
        'text-[#6d6d6d]',
        'text-[#6d6d6d]',
        // 'border-blue-100'
      ];
      break;
  }

  return (
    <div 
      className={`Alert _border-[1px] ${colorClasses[5]} border-solid fixed bottom-3 left-3 md:left-[calc(50vw-(700px/2))] _lg:_left-[calc(50vw-((700px-8rem)/2))] ${closed ? "_-z-10" : "z-50"}`}
      style={style}
      >
      <div className={`_bg-pink-200 ${closed ? "opacity-0" : "opacity-100"} transition-all rounded-sm ${colorClasses[0]} p-[0.8rem] w-[calc(100vw-1.5rem)] md:w-[700px] shadow-md hover:shadow-lg`}>
        <div className="flex flex-col gap-[0.4rem] ">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div className={`_bg-yellow-200 ${icon ? "ml-3" : ""}`}>
              <div
                className={`text-md font-medium ${colorClasses[3]}`}
                dangerouslySetInnerHTML={{ __html: message }}
              />
            </div>
            <div className="_bg-orange-200 _ml-auto pl-[0rem]">
              <div className="_bg-orange-400 absolute top-[0.2rem] right-[0.2rem] opacity-40 hover:opacity-100">
                <button
                  type="button"
                  className={`inline-flex rounded-md ${colorClasses[0]} p-0 ${colorClasses[4]} ${colorClasses[1]} focus:outline-none ${colorClasses[2]} focus:ring-offset-2`}
                  onClick={handleClose}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-row mx-auto my-[0rem]">
            {customActions && customActions.map((ca: CustomAction, i: number) => {
              if (ca) {
                return (
                  <div
                    key={i}
                    className={`Action _bg-pink-100 text-center`}
                    onClick={typeof (ca.action) == "string" && ca.action == "close" ? handleClose : ca.action}
                  >
                    <div className={`_bg-pink-200 w-fit h-fit m-auto px-1 font-bold cursor-pointer hover:underline ${colorClasses[0]} ${colorClasses[4]} ${colorClasses[1]}`}>
                      {ca.label}
                    </div>
                  </div>
                )
              }
            })}
            {!customActions &&
              <div
                className={`Action _bg-pink-100 text-center text-md font-medium`}
                onClick={handleClose}
              >
                <div className={`_bg-pink-200 w-fit m-auto px-1 font-bold cursor-pointer hover:underline ${colorClasses[0]} ${colorClasses[4]} ${colorClasses[1]}`}>
                  {closeLabel || "Close"}
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// handle closed and pulse effect
function AnimatedAlert({
  message,
  type,
  style,
  onDismiss,
  closeLabel,
  closedTimestamp,
  timestamp,
  customActions,
}: {
  message: string,
  type: AlertType,
  style?: any
  onDismiss?: () => void,
  closeLabel?: string,
  closedTimestamp?: number,
  timestamp: number,
  customActions?: any,
}) {
  const [reset] = useAlert((state: any) => [state.reset]);
  const [lastMessage, setLastMessage] = useState<string | undefined>(message);
  let [dismissedAt, setDismissedAt] = useState<number | undefined>();

  useEffect(() => {
    // console.log('>> app._components.Alert.AnimatedAlert.render() useEffect', { message, lastMessage, timestamp });

    // make the thing pulse a bit when same message but was not dismissed
    if (lastMessage && (message == lastMessage) && !dismissedAt) {
      // console.log('>> app._components.Alert.AnimatedAlert.render() useEffect starting pulse', { message, lastMessage, timestamp });
      dismissedAt = timestamp; // not quite sure why but there's a race condition causing a visual glitch and this fixes it
      setDismissedAt(moment().valueOf());

      setTimeout(() => {
        // console.log('>> app._components.Alert.AnimatedAlert.render() useEffect finishing pulse', { message, lastMessage, timestamp });
        setDismissedAt(undefined);
      }, 50);
    }

    if (timestamp != dismissedAt) {
      setDismissedAt(undefined);
    }

    setLastMessage(message);

    document.body.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown)
    }
  }, [message, timestamp]);

  useEffect(() => {
    // console.log('>> app._components.Alert.AnimatedAlert.render() useEffect', { closedTimestamp });
    handleClose();
  }, [closedTimestamp]);

  const handleKeyDown = async (e: any) => {
    // console.log(">> app._components.Alert.AnimatedAlert.handleKeyDown", { e });
    if (e.key == "Escape") {
      handleClose();
    }
  }

  const handleClose = () => {
    setDismissedAt(timestamp);
    onDismiss && onDismiss();
    setTimeout(reset, 50);
  }

  // console.log('>> app._components.Alert.AnimatedAlert.render()', { message, timestamp, lastMessage, dismissedAt });

  if (message) {
    return (
      <TypedAlert
        message={message}
        type={type}
        style={style}
        closed={!!dismissedAt}
        handleClose={handleClose}
        closeLabel={closeLabel}
        customActions={customActions}
      />
    )
  }
}

export default function Alert({
  message,
  type,
}: {
  message?: string | undefined,
  type?: AlertType | undefined
}) {
  const [
    _message,
    _type,
    style,
    onDismiss,
    closeLabel,
    closedTimestamp,
    customActions,
  ] = useAlert((state: any) => [
    state.message,
    state.type,
    state.style,
    state.onDismiss,
    state.closeLabel,
    state.closedTimestamp,
    state.customActions,
  ]);

  // console.log('>> app._components.Alert.Error.render()', { message, _message });

  return (
    <AnimatedAlert
      message={message || _message}
      type={type || _type || "info"}
      style={style}
      onDismiss={onDismiss}
      closeLabel={closeLabel}
      closedTimestamp={closedTimestamp}
      timestamp={moment().valueOf()}
      customActions={customActions}
    />
  )
}
