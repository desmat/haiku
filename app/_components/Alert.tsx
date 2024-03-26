'use client'

import moment from 'moment';
import { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { MdCelebration } from "react-icons/md";
import { MdOutlineCelebration } from "react-icons/md";
import useAlert from '@/app/_hooks/alert';
import { AlertType } from '@/types/Alert';

// from https://tailwindui.com/components/application-ui/feedback/alerts

function TypedAlert({
  message,
  type,
  closed,
  handleClose,
  closeLabel,
}: {
  message: string,
  type: AlertType,
  closed: boolean,
  handleClose: any,
  closeLabel?: string,
}) {
  // console.log('>> app._components.Alert.Alert.render()', { message, type, closed });
  let icon;
  let colorClasses;

  switch (type) {
    case 'error':
      icon = undefined //<ExclamationTriangleIcon className={`h-5 w-5 text-red-400`} aria-hidden="true" />
      colorClasses = [
        'bg-red-50',
        'hover:bg-red-100',
        'active:bg-red-200',
        'text-red-800',
        'text-red-800',
        // 'border-red-100',
      ];
      break;
    case "warning":
      icon = undefined //<ExclamationCircleIcon className={`h-5 w-5 text-yellow-400`} aria-hidden="true" />
      colorClasses = [
        'bg-yellow-50',
        'hover:bg-yellow-100',
        'active:bg-yellow-200',
        'text-yellow-800',
        'text-yellow-500',
        // 'border-yellow-200',
      ];
      break;
    case "success":
      icon = undefined //<MdCelebration className={`h-5 w-5 text-[#6d6d6d]`} aria-hidden="true" />
      colorClasses = [
        'bg-[#f8f8f8]',
        'hover:bg-black-100',
        'active:bg-black-200',
        'text-[#6d6d6d]',
        'text-[#6d6d6d]',
        // 'border-green-100',
      ];
      break;
    case "info":
      icon = undefined //<InformationCircleIcon className={`h-5 w-5 text-blue-400`} aria-hidden="true" />
      colorClasses = [
        'bg-blue-50',
        'hover:bg-blue-100',
        'active:bg-blue-200',
        'text-blue-800',
        'text-blue-500',
        // 'border-blue-100'
      ];
      break;
    default: //case "info":
      icon = undefined;
      colorClasses = [
        'bg-[#f8f8f8]',
        'hover:text-black',
        'active:text-black',
        'text-[#6d6d6d]',
        'text-[#6d6d6d]',
        // 'border-blue-100'
      ];
      break;
  }

  return (
    <div className={`_border-[1px] ${colorClasses[5]} border-solid fixed bottom-3 left-3 md:left-[calc(50vw-(700px/2))] _lg:_left-[calc(50vw-((700px-8rem)/2))] ${closed ? "_-z-10" : "z-20"}`}>
      <div className={`${closed ? "opacity-0" : "opacity-100"} transition-all rounded-sm ${colorClasses[0]} px-2 py-1 w-[calc(100vw-1.5rem)] md:w-[700px] shadow-md hover:shadow-lg`}>
        <div className="flex flex-col">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div className={`${icon ? "ml-3" : ""}`}>
              <p className={`text-sm font-medium ${colorClasses[3]}`} dangerouslySetInnerHTML={{ __html: message }} />
            </div>
            <div className="ml-auto pl-3">
              <div className="absolute top-1 right-[-0px] opacity-40 hover:opacity-100">
                <button
                  type="button"
                  className={`inline-flex rounded-md ${colorClasses[0]} p-0 ${colorClasses[4]} ${colorClasses[1]} focus:outline-none ${colorClasses[2]} focus:ring-offset-2`}
                  onClick={handleClose}
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
          <div
            className={`_bg-pink-100 text-center`}
            onClick={handleClose}
          >
            <div className={`_bg-pink-200 w-fit m-auto px-2 font-bold cursor-pointer hover:underline text-sm ${colorClasses[0]} ${colorClasses[4]} ${colorClasses[1]}`}>
              {closeLabel || "Close"}
            </div>
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
  onDissmiss,
  closeLabel,
  closedTimestamp,
  timestamp,
}: {
  message: string,
  type: AlertType,
  onDissmiss?: () => void,
  closeLabel?: string,
  closedTimestamp?: number,
  timestamp: number
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
    onDissmiss && onDissmiss();
    setTimeout(reset, 50);
  }

  // console.log('>> app._components.Alert.AnimatedAlert.render()', { message, timestamp, lastMessage, dismissedAt });

  if (message) {
    return (
      <TypedAlert message={message} type={type} closed={!!dismissedAt} handleClose={handleClose} closeLabel={closeLabel} />
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
    onDissmiss,
    closeLabel,
    closedTimestamp
  ] = useAlert((state: any) => [
    state.message,
    state.type,
    state.onDissmiss,
    state.closeLabel,
    state.closedTimestamp,
  ]);

  // console.log('>> app._components.Alert.Error.render()', { message, _message });

  return (
    <AnimatedAlert
      message={message || _message}
      type={type || _type || "info"}
      onDissmiss={onDissmiss}
      closeLabel={closeLabel}
      closedTimestamp={closedTimestamp}
      timestamp={moment().valueOf()}
    />
  )
}
