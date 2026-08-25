import { Button } from '../../components/Button.jsx'

export function RunEndScreen({ victory, floorsCleared, onReturnToMenu }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl">{victory ? 'The Quarry Is Cleared' : 'You Have Fallen'}</h1>
      <p className="text-ink-muted">
        {victory
          ? `You fought through ${floorsCleared} floors and broke the Quarry Titan.`
          : `You made it through ${floorsCleared} floors before falling.`}
      </p>
      <Button variant="primary" onClick={onReturnToMenu} className="px-8 py-3 text-base">
        Return to Menu
      </Button>
    </div>
  )
}
