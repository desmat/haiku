'use client'

import { useEffect } from 'react';
import { uuid } from '@/utils/misc';
import { useLocalStorage } from 'usehooks-ts';
import { encodeJWT } from '@/utils/jwt';

export default function User() {
  const [session, setSession] = useLocalStorage<string | undefined>("session", undefined);
  console.log('>> app.page.render()', { session });

  useEffect(() => {
    if (!session) {
      console.log('>> app.page.render() creating session',);
      encodeJWT({ user: { id: uuid(), isAnonymous: true, preferences: {} } })
        .then((jwt: string) => {
          console.log('>> app.page.render() session created', { jwt });
          setSession(jwt);
          console.log('>> app.page.render() session saved', { jwt });
        });
    }

  }, []);

  return null;
}
