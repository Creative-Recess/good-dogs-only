// Draws every breed's Park dog on its own small canvas, for reviewing the shapes in data/dog-shapes.json.
// design/make-dog-review.ts screenshots these into a shareable page.
import { breeds } from '../src/data/catalogue.ts'
import { drawDog, type Dog } from '../src/park/dog.ts'

const W = 150
const H = 110
const host = document.getElementById('dogs')!
for (const b of breeds) {
  const c = document.createElement('canvas')
  c.width = W * 2
  c.height = H * 2
  c.dataset.id = b.id
  host.append(c)
  const x = c.getContext('2d')!
  x.scale(2, 2)
  x.fillStyle = '#86c35f'
  x.fillRect(0, 0, W, H)
  const dog: Dog = {
    breed: b, shape: b.shape, body: b.image!.colours.body, patch: b.image!.colours.patch, seed: 1, x: 0, y: 0, dir: 1,
    state: 'idle', timer: 0, hop: 0, happy: 1, scale: 1.9, tx: 0, ty: 0, toSpot: false, friend: null, leaving: false,
  }
  // Same scale for every dog, so sizes compare across breeds.
  x.translate(W / 2 - b.shape.len * 0.15, H - 10)
  drawDog(x, dog, 0)
}
document.body.dataset.ready = '1'
