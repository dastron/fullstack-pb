import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  IconButton,
  Image,
  SimpleGrid,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

interface ImageUploadMultipleProps {
  name: string;
  multiple?: boolean;
  value?: File[];
  onChange?: (files: File[]) => void;
  error?: string;
}

const ImageUploadMultiple: React.FC<ImageUploadMultipleProps> = ({
  name,
  multiple = false,
  value = [],
  onChange,
  error,
}) => {
  // Local state to store the file and its preview URL
  const [uploads, setUploads] = useState<{ file: File; preview: string }[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync uploads state with value prop
  useEffect(() => {
    const newUploads = value.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploads(newUploads);

    // Cleanup function
    return () => {
      newUploads.forEach((upload) => URL.revokeObjectURL(upload.preview));
    };
  }, [value.length]); // Everything breaks if you changes this to value

  // Handle file selection.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      // Map the files to our uploads state format.
      const newUploads = Array.from(selectedFiles).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      let updatedUploads: { file: File; preview: string }[];
      if (multiple) {
        updatedUploads = [...uploads, ...newUploads];
      } else {
        // if not multiple, clean up any previous preview URLs.
        uploads.forEach((upload) => URL.revokeObjectURL(upload.preview));
        updatedUploads = newUploads;
      }
      setUploads(updatedUploads);
      // Invoke the onChange handler if provided.
      if (onChange) {
        onChange(updatedUploads.map((u) => u.file));
      }
    }
  };

  // Remove an image from uploads.
  const handleDelete = (index: number) => {
    const uploadToDelete = uploads[index];
    if (uploadToDelete) {
      URL.revokeObjectURL(uploadToDelete.preview);
    }
    const updatedUploads = uploads.filter((_, i) => i !== index);
    setUploads(updatedUploads);
    if (onChange) {
      onChange(updatedUploads.map((u) => u.file));
    }
  };

  // Programmatically trigger the hidden file input.
  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <FormControl isInvalid={!!error}>
      <Card>
        <CardBody>
          {/* Hidden file input */}
          <input
            id={name}
            name={name}
            type="file"
            style={{ display: "none" }}
            accept="image/jpeg,image/png,image/webp"
            multiple={multiple}
            ref={inputRef}
            onChange={handleInputChange}
            data-testid="image-upload-input"
          />
          <Button variant="outline" onClick={handleClick} data-testid="image-upload-button">
            Select Image{multiple ? "s" : ""}
          </Button>

          {/* Display previews if any image is uploaded */}
          {uploads.length > 0 && (
            <SimpleGrid columns={[2, 3, 4]} spacing="10px" mt={4} data-testid="image-preview-grid">
              {uploads.map((upload, index) => (
                <Box
                  key={index}
                  position="relative"
                  width="200px"
                  height="200px"
                  data-testid={`image-preview-box-${index}`}
                >
                  <Image
                    src={upload.preview}
                    alt="Uploaded preview"
                    objectFit="cover"
                    width="100%"
                    height="100%"
                    borderRadius="md"
                    data-testid={`image-preview-${index}`}
                  />
                  <IconButton
                    icon={<CloseIcon />}
                    size="xs"
                    aria-label="Remove image"
                    position="absolute"
                    top="2px"
                    right="2px"
                    onClick={() => handleDelete(index)}
                    bg="whiteAlpha.800"
                    _hover={{ bg: "whiteAlpha.900" }}
                    borderRadius="full"
                    data-testid={`image-delete-button-${index}`}
                  />
                </Box>
              ))}
            </SimpleGrid>
          )}
          {error && <FormErrorMessage data-testid="image-upload-error">{error}</FormErrorMessage>}
        </CardBody>
      </Card>
    </FormControl>
  );
};

export default ImageUploadMultiple;
