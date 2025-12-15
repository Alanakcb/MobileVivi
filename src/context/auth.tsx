import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState, useEffect } from "react"
import { initSessionDB, hasActiveSession } from "../services/sessionStorage"
import { restoreSession } from "../services/supabaseAuth"

export interface IAuthContextData {
  login: boolean
  setLogin: Dispatch<SetStateAction<boolean>>
  loading: boolean
}
export interface IProvider {
  children: ReactNode
}
const AuthContext = createContext<IAuthContextData>({} as IAuthContextData)

export const AuthProvider = ({children}:IProvider) => {
  const [login, setLogin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Inicializar banco de dados e verificar sessão
    const initAuth = async () => {
      try {
        await initSessionDB()
        
        // Verificar se há sessão ativa salva localmente
        const hasSession = await hasActiveSession()
        
        if (hasSession) {
          console.log('Sessão local encontrada, autenticando...')
          // Se há sessão no SQLite, considerar autenticado
          // Isso permite que funcione offline
          setLogin(true)
          
          // Tentar sincronizar com Supabase em background (não bloqueia)
          restoreSession().catch(err => {
            console.log('Não foi possível sincronizar com servidor, continuando offline')
          })
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
  }, [])

  return (
    <AuthContext.Provider value={{login, setLogin, loading}}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): IAuthContextData {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth deve ser utilizado com o AuthProvider')
    }
    return context
}
