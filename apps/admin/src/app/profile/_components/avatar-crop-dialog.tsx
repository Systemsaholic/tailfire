'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AvatarCropDialogProps {
  file: File | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCropComplete: (croppedBlob: Blob, fileName: string, mimeType: string) => void
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export function AvatarCropDialog({
  file,
  open,
  onOpenChange,
  onCropComplete,
}: AvatarCropDialogProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imageSrc, setImageSrc] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Load image when file changes
  useEffect(() => {
    if (file) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string)
      })
      reader.readAsDataURL(file)
    } else {
      setImageSrc('')
      setCrop(undefined)
      setCompletedCrop(undefined)
    }
  }, [file])

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }, [])

  const handleCropConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop || !file) return

    setIsProcessing(true)

    try {
      const image = imgRef.current
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Calculate the scale factor between natural and displayed size
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      // Set canvas size to the cropped area (using natural dimensions for quality)
      const cropX = completedCrop.x * scaleX
      const cropY = completedCrop.y * scaleY
      const cropWidth = completedCrop.width * scaleX
      const cropHeight = completedCrop.height * scaleY

      // Use a fixed output size for consistency (256x256 for avatars)
      const outputSize = 256
      canvas.width = outputSize
      canvas.height = outputSize

      // Draw the cropped portion of the image
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputSize,
        outputSize
      )

      // Preserve original MIME type
      const mimeType = file.type || 'image/png'
      const quality = mimeType === 'image/jpeg' ? 0.92 : undefined

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob, file.name, mimeType)
            onOpenChange(false)
          }
          setIsProcessing(false)
        },
        mimeType,
        quality
      )
    } catch (error) {
      console.error('Error cropping image:', error)
      setIsProcessing(false)
    }
  }, [completedCrop, file, onCropComplete, onOpenChange])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
    setImageSrc('')
    setCrop(undefined)
    setCompletedCrop(undefined)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Profile Picture</DialogTitle>
          <DialogDescription>
            Adjust the crop area to select the portion of the image you want to use.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          {imageSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              className="max-h-[400px]"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[400px] max-w-full"
              />
            </ReactCrop>
          ) : (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              Loading image...
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleCropConfirm} disabled={!completedCrop || isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
