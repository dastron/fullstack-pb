import React, { useMemo } from "react";
import pb from "@/pb";
import { Image, ImageProps } from "@chakra-ui/react";

const buildThumbnailURL = (src: string, object?: any) => {
  return src ? pb.getFileUrl(object, src, { thumb: "1920x0" }) : `https://picsum.photos/seed/${object?.id}/1200/600`;
};

interface ImageViewerProps extends ImageProps {
  src: string;
  entity?: any;
}

export const ImageViewer = React.memo(({ src, entity, ...imageProps }: ImageViewerProps) => {
  const thumbnailURL = useMemo(() => buildThumbnailURL(src, entity), [src, entity]);

  return <Image {...imageProps} src={thumbnailURL} />;
});
