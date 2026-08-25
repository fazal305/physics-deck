import { useEffect, useRef } from 'react'
import { ARENA } from '../../engine/physics/arenaConfig.js'
import { PHYSICS_EVENT } from '../../engine/events/eventTypes.js'
import { useCombatStore } from '../../stores/useCombatStore.js'

const PLAYER_COLOR = { fill: '#5b90a3', stroke: '#345a68' }
const ENEMY_COLOR = { fill: '#8a5a52', stroke: '#5a352f' }

/**
 * Imperative canvas renderer. Runs its own requestAnimationFrame loop that
 * reads live Matter body positions directly off the physics engine — React
 * never re-renders because of this loop. Combat stats (HP/status) are
 * mirrored into a ref via Zustand's vanilla `subscribe`, not React state, so
 * updating them doesn't trigger a React render either.
 */
export function PhysicsCanvas({ physicsEngine, reducedMotion, screenShakeEnabled }) {
  const canvasRef = useRef(null)
  const snapshotRef = useRef({ player: null, enemies: [] })
  const particlesRef = useRef([])
  const floatersRef = useRef([])
  const shakeRef = useRef(0)

  useEffect(() => {
    snapshotRef.current = { player: useCombatStore.getState().player, enemies: useCombatStore.getState().enemies }
    const unsub = useCombatStore.subscribe((state) => {
      snapshotRef.current = { player: state.player, enemies: state.enemies }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!physicsEngine) return
    const spawnParticles = (x, y, color, count) => {
      if (reducedMotion) return
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 1.5 + Math.random() * 3
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1,
          color,
        })
      }
    }
    const spawnFloater = (x, y, text, color) => {
      floatersRef.current.push({ x, y, text, color, life: 1 })
    }
    const addShake = (amount) => {
      if (reducedMotion || !screenShakeEnabled) return
      shakeRef.current = Math.min(14, shakeRef.current + amount)
    }

    const unsubCollision = physicsEngine.bus.on(PHYSICS_EVENT.COLLISION_RESOLVED, (payload) => {
      spawnParticles(payload.point.x, payload.point.y, '#e8dcc8', Math.min(14, 4 + payload.damage))
      spawnFloater(payload.point.x, payload.point.y - 20, `-${payload.damage}`, '#d65f52')
      addShake(Math.min(10, payload.impactSpeed * 0.6))
    })
    const unsubExplosion = physicsEngine.bus.on(PHYSICS_EVENT.EXPLOSION, (payload) => {
      spawnParticles(payload.point.x, payload.point.y, '#f0995a', 28)
      addShake(14)
    })
    return () => {
      unsubCollision()
      unsubExplosion()
    }
  }, [physicsEngine, reducedMotion, screenShakeEnabled])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !physicsEngine) return
    const ctx = canvas.getContext('2d')
    let rafId

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const shake = shakeRef.current
      shakeRef.current = Math.max(0, shake * 0.85 - 0.2)
      const shakeX = shake ? (Math.random() - 0.5) * shake : 0
      const shakeY = shake ? (Math.random() - 0.5) * shake : 0

      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, ARENA.width, ARENA.height)
      ctx.translate(shakeX, shakeY)

      // arena backdrop
      ctx.fillStyle = '#181521'
      ctx.fillRect(0, 0, ARENA.width, ARENA.height)
      ctx.strokeStyle = '#2c2734'
      ctx.lineWidth = 1
      for (let x = 0; x < ARENA.width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, ARENA.height)
        ctx.stroke()
      }
      // floor
      ctx.fillStyle = '#2a2620'
      ctx.fillRect(0, ARENA.height - 4, ARENA.width, 4)

      const snapshot = snapshotRef.current

      for (const [, body] of physicsEngine.getAllEntityBodies()) {
        const meta = body.plugin?.physicsDeck
        if (!meta) continue
        const { x, y } = body.position

        if (meta.kind === 'combatant') {
          const isPlayer = meta.team === 'player'
          const color = isPlayer ? PLAYER_COLOR : ENEMY_COLOR
          const radius = body.circleRadius ?? 26
          drawCombatant(ctx, x, y, radius, body.angle, color)

          const stats = isPlayer
            ? snapshot.player
            : snapshot.enemies.find((e) => e.id === meta.entityId)
          if (stats) drawStatsBadge(ctx, x, y - radius - 18, stats, isPlayer)
        } else if (meta.kind === 'object') {
          drawObject(ctx, body, meta.profile)
        }
      }

      // particles
      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.life -= 0.035
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // floating damage numbers
      const floaters = floatersRef.current
      ctx.textAlign = 'center'
      ctx.font = '600 15px "IBM Plex Mono", monospace'
      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i]
        f.y -= 0.6
        f.life -= 0.018
        if (f.life <= 0) {
          floaters.splice(i, 1)
          continue
        }
        ctx.globalAlpha = Math.max(0, f.life)
        ctx.fillStyle = f.color
        ctx.fillText(f.text, f.x, f.y)
        ctx.globalAlpha = 1
      }

      ctx.restore()
      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [physicsEngine])

  return (
    <canvas
      ref={canvasRef}
      width={ARENA.width * (window.devicePixelRatio || 1)}
      height={ARENA.height * (window.devicePixelRatio || 1)}
      style={{ width: '100%', height: 'auto', aspectRatio: `${ARENA.width} / ${ARENA.height}`, display: 'block', borderRadius: 8 }}
      role="img"
      aria-label="Physics combat arena"
    />
  )
}

function drawCombatant(ctx, x, y, radius, angle, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.fillStyle = color.fill
  ctx.strokeStyle = color.stroke
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(radius, 0)
  ctx.stroke()
  ctx.restore()
}

function drawObject(ctx, body, profile) {
  const { x, y } = body.position
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(body.angle)
  ctx.fillStyle = profile.color
  ctx.strokeStyle = profile.strokeColor
  ctx.lineWidth = 2
  if (profile.shape === 'circle') {
    ctx.beginPath()
    ctx.arc(0, 0, profile.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.rect(-profile.width / 2, -profile.height / 2, profile.width, profile.height)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

function drawStatsBadge(ctx, x, y, stats, isPlayer) {
  const width = 56
  const height = 6
  const pct = Math.max(0, stats.hp / stats.maxHp)
  ctx.save()
  ctx.translate(x - width / 2, y)
  ctx.fillStyle = 'rgba(14,12,17,0.8)'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = isPlayer ? '#7db3c7' : '#d65f52'
  ctx.fillRect(0, 0, width * pct, height)
  if (stats.block > 0) {
    ctx.fillStyle = '#c9a24a'
    ctx.font = '600 10px "IBM Plex Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`+${stats.block}`, width + 4, height)
  }
  ctx.restore()
}
