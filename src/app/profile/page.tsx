import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPlayersService } from '@/services/players.service'
import { Navbar } from '@/components/Navbar'
import { ProfileClient } from './ProfileClient'

/**
 * Server Component para la ruta /profile.
 * Utiliza await connection() para excluir el acceso a datos y cookies de autenticación
 * del prerender estático, permitiendo que Next.js transmita de inmediato el shell
 * definido en app/profile/loading.tsx vía Partial Prerendering (PPR) sin errores de Date.now().
 */
export default async function ProfilePage() {
  await connection()

  const supabase = await createClient()

  // 1. Obtener usuario autenticado en el servidor
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    redirect('/auth')
  }

  // 2. Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // 3. Obtener o asegurar registro de Player para el usuario
  const playersService = createPlayersService(supabase)
  let { data: player } = await playersService.getPlayerByUserId(user.id)

  if (!player && profile?.role !== 'admin') {
    const defaultName =
      profile?.display_name ||
      user.user_metadata?.display_name ||
      user.email?.split('@')[0] ||
      'Combatiente'
    const ensured = await playersService.ensurePlayerForUser(user.id, defaultName)
    player = ensured.data
  }

  // 4. Obtener lista de clanes disponibles
  const { data: clans } = await supabase
    .from('clans')
    .select('*')
    .order('name', { ascending: true })

  return (
    <>
      <Navbar />
      <ProfileClient
        user={{ id: user.id, email: user.email || '' }}
        initialProfile={profile}
        initialPlayer={player}
        clans={clans || []}
      />
    </>
  )
}
