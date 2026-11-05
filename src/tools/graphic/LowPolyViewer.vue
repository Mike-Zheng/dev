<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh as ThreeMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useI18n } from '@/i18n'
import { useSettings } from '@/composables/useSettings'
import type { Mesh } from './lowPoly'

const props = defineProps<{
  mesh: Mesh | null
  wireframe: boolean
  autoRotate: boolean
  /** Changing this re-frames the camera around the model (e.g. when a new model is loaded). */
  fitKey: number
}>()

const { t } = useI18n()
const { isDark } = useSettings()

const container = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const glFailed = ref(false)

let renderer: WebGLRenderer | null = null
let controls: OrbitControls | null = null
let observer: ResizeObserver | null = null
let raf = 0
let dirty = true
const scene = new Scene()
const camera = new PerspectiveCamera(40, 1, 0.01, 1000)
// Models (STL, 3D printing) are Z-up; three.js is Y-up.
const root = new Group()
root.rotation.x = -Math.PI / 2
scene.add(root)
let geometry: BufferGeometry | null = null
const solidMat = new MeshStandardMaterial({
  flatShading: true,
  roughness: 0.6,
  metalness: 0.05,
  side: DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
})
const wireMat = new MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.28, depthWrite: false })
const solid = new ThreeMesh(new BufferGeometry(), solidMat)
const wire = new ThreeMesh(solid.geometry, wireMat)
root.add(solid, wire)
scene.add(new HemisphereLight(0xffffff, 0x6b7a88, 1.4))
const keyLight = new DirectionalLight(0xffffff, 2.2)
keyLight.position.set(1, 1.6, 2)
camera.add(keyLight)
scene.add(camera)

function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'
}
function applyColors() {
  solidMat.color.setStyle(cssColor('--c-accent'))
  wireMat.color.setStyle(cssColor('--c-accent-fg'))
  wireMat.opacity = isDark.value ? 0.45 : 0.4
  dirty = true
}

function setMesh(m: Mesh | null) {
  const old = geometry
  const g = new BufferGeometry()
  if (m && m.indices.length) {
    g.setAttribute('position', new BufferAttribute(m.positions, 3))
    g.setIndex(new BufferAttribute(m.indices, 1))
    g.computeBoundingSphere()
    // Keep the model centred on the orbit target.
    const c = g.boundingSphere!.center
    solid.position.set(-c.x, -c.y, -c.z)
    wire.position.copy(solid.position)
  }
  solid.geometry = g
  wire.geometry = g
  geometry = g
  old?.dispose()
  dirty = true
}

function fit() {
  const r = geometry?.boundingSphere?.radius || 1
  const dist = (r / Math.sin(((camera.fov / 2) * Math.PI) / 180)) * 1.1
  camera.position.copy(new Vector3(0.62, 0.42, 0.66).normalize().multiplyScalar(dist))
  camera.near = dist / 100
  camera.far = dist * 100
  camera.updateProjectionMatrix()
  controls?.target.set(0, 0, 0)
  controls?.update()
  dirty = true
}

function resize() {
  const el = container.value
  if (!el || !renderer) return
  const w = Math.max(1, el.clientWidth)
  const h = Math.max(1, el.clientHeight)
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  dirty = true
}

function loop() {
  raf = requestAnimationFrame(loop)
  const moved = controls?.update() ?? false
  if ((moved || dirty) && renderer) {
    renderer.render(scene, camera)
    dirty = false
  }
}

onMounted(() => {
  try {
    renderer = new WebGLRenderer({ canvas: canvas.value!, antialias: true, alpha: true })
  } catch {
    glFailed.value = true
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.autoRotate = props.autoRotate
  controls.autoRotateSpeed = 1.5
  controls.addEventListener('change', () => (dirty = true))
  observer = new ResizeObserver(resize)
  observer.observe(container.value!)
  applyColors()
  setMesh(props.mesh)
  resize()
  fit()
  loop()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  controls?.dispose()
  geometry?.dispose()
  solidMat.dispose()
  wireMat.dispose()
  renderer?.dispose()
})

watch(
  () => props.mesh,
  (m) => setMesh(m),
)
watch(
  () => props.fitKey,
  () => fit(),
  { flush: 'post' },
)
watch(
  () => props.wireframe,
  (v) => {
    wire.visible = v
    dirty = true
  },
  { immediate: true },
)
watch(
  () => props.autoRotate,
  (v) => {
    if (controls) controls.autoRotate = v
  },
)
watch(isDark, applyColors)

defineExpose({ resetView: fit })
</script>

<template>
  <div ref="container" class="relative h-full w-full">
    <canvas ref="canvas" class="block h-full w-full touch-none outline-none" />
    <div v-if="glFailed" class="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-fg-muted">
      {{ t('tools.low-poly.noWebgl') }}
    </div>
  </div>
</template>
