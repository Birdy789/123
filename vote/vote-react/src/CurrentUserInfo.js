import { createContext } from "react";
import { useAxios } from "./hooks";

export var UserContext = createContext()

export default function CurrentUserInfo({ children }) {

  var userInfo = useAxios({ url: '/account/current-user' })


  return (
    <UserContext.Provider value={userInfo}>
      {children}
    </UserContext.Provider>
  )
}
