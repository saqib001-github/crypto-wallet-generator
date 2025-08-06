"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

interface MnemonicDisplayProps {
  mnemonic: string
  onCopy: () => void
}

export function MnemonicDisplay({ mnemonic, onCopy }: MnemonicDisplayProps) {
  const [isVisible, setIsVisible] = useState(true)
  const words = mnemonic.split(" ")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Mnemonic Phrase</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)}>
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {words.map((word, index) => (
            <div key={index} className="p-2 bg-muted rounded-md text-center text-sm font-mono">
              <span className="text-xs text-muted-foreground mr-1">{index + 1}.</span>
              {isVisible ? word : "•••••"}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
