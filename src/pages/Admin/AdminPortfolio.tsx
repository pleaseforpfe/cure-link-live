import React, { useState } from 'react';
import {
  Box,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  Select,
  Image,
  Text,
  Grid,
  IconButton,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';

const AdminPortfolio = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const toast = useToast();

  // Bulk upload state
  const [bulkImages, setBulkImages] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);

  // Individual item state
  const [singleItem, setSingleItem] = useState({
    title: '',
    category: '',
    image: null,
  });
  const [singleUploading, setSingleUploading] = useState(false);

  // Handle bulk image file selection
  const handleBulkImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random(),
    }));
    setBulkImages([...bulkImages, ...newImages]);
  };

  // Remove bulk image
  const removeBulkImage = (id) => {
    const imageToRemove = bulkImages.find((img) => img.id === id);
    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setBulkImages(bulkImages.filter((img) => img.id !== id));
  };

  // Upload bulk images
  const handleBulkUpload = async () => {
    if (bulkImages.length === 0) {
      toast({
        title: 'No images selected',
        description: 'Please select at least one image to upload.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setBulkUploading(true);
    try {
      const formData = new FormData();
      bulkImages.forEach((img) => {
        formData.append('images', img.file);
      });

      // Replace with your actual API endpoint
      const response = await fetch('/api/portfolio/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      toast({
        title: 'Success',
        description: `${bulkImages.length} images uploaded successfully!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Clear uploaded images
      bulkImages.forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
      setBulkImages([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload images',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setBulkUploading(false);
    }
  };

  // Handle single item image selection
  const handleSingleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSingleItem({
        ...singleItem,
        image: {
          file,
          preview: URL.createObjectURL(file),
        },
      });
    }
  };

  // Upload single item with details
  const handleSingleItemUpload = async () => {
    if (!singleItem.image) {
      toast({
        title: 'No image selected',
        description: 'Please select an image to upload.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSingleUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', singleItem.image.file);
      formData.append('title', singleItem.title || '');
      formData.append('category', singleItem.category || '');

      // Replace with your actual API endpoint
      const response = await fetch('/api/portfolio/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      toast({
        title: 'Success',
        description: 'Portfolio item created successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      if (singleItem.image?.preview) {
        URL.revokeObjectURL(singleItem.image.preview);
      }
      setSingleItem({
        title: '',
        category: '',
        image: null,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload item',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSingleUploading(false);
    }
  };

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="blue">
        <TabList>
          <Tab>Bulk Upload (No Details)</Tab>
          <Tab>Add Individual Item</Tab>
        </TabList>

        <TabPanels>
          {/* Bulk Upload Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Text fontSize="lg" fontWeight="bold">
                Upload Multiple Images Without Title or Category
              </Text>

              <FormControl>
                <FormLabel>Select Images</FormLabel>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleBulkImageSelect}
                  p={1}
                />
              </FormControl>

              {bulkImages.length > 0 && (
                <>
                  <Text fontSize="sm" color="gray.600">
                    {bulkImages.length} image(s) selected
                  </Text>

                  <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={4}>
                    {bulkImages.map((img) => (
                      <Box
                        key={img.id}
                        position="relative"
                        borderRadius="md"
                        overflow="hidden"
                        bg="gray.100"
                      >
                        <Image
                          src={img.preview}
                          alt="preview"
                          w="100%"
                          h="150px"
                          objectFit="cover"
                        />
                        <IconButton
                          aria-label="Delete image"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          position="absolute"
                          top={1}
                          right={1}
                          onClick={() => removeBulkImage(img.id)}
                        />
                      </Box>
                    ))}
                  </Grid>

                  <HStack spacing={4}>
                    <Button
                      colorScheme="green"
                      onClick={handleBulkUpload}
                      isLoading={bulkUploading}
                      loadingText="Uploading..."
                    >
                      Upload All Images
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        bulkImages.forEach((img) => {
                          if (img.preview) URL.revokeObjectURL(img.preview);
                        });
                        setBulkImages([]);
                      }}
                    >
                      Clear All
                    </Button>
                  </HStack>
                </>
              )}
            </VStack>
          </TabPanel>

          {/* Individual Item Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch" maxW="500px">
              <Text fontSize="lg" fontWeight="bold">
                Add Portfolio Item With Details
              </Text>

              <FormControl>
                <FormLabel>Image *</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleSingleImageSelect}
                  p={1}
                />
              </FormControl>

              {singleItem.image?.preview && (
                <Box borderRadius="md" overflow="hidden" bg="gray.100">
                  <Image
                    src={singleItem.image.preview}
                    alt="preview"
                    w="100%"
                    h="300px"
                    objectFit="cover"
                  />
                </Box>
              )}

              <FormControl>
                <FormLabel>Title (Optional)</FormLabel>
                <Input
                  placeholder="Enter title"
                  value={singleItem.title}
                  onChange={(e) =>
                    setSingleItem({ ...singleItem, title: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel>Category (Optional)</FormLabel>
                <Select
                  placeholder="Select category"
                  value={singleItem.category}
                  onChange={(e) =>
                    setSingleItem({ ...singleItem, category: e.target.value })
                  }
                >
                  <option value="web">Web Design</option>
                  <option value="mobile">Mobile App</option>
                  <option value="branding">Branding</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              <HStack spacing={4}>
                <Button
                  colorScheme="blue"
                  onClick={handleSingleItemUpload}
                  isLoading={singleUploading}
                  loadingText="Uploading..."
                >
                  Upload Item
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (singleItem.image?.preview) {
                      URL.revokeObjectURL(singleItem.image.preview);
                    }
                    setSingleItem({
                      title: '',
                      category: '',
                      image: null,
                    });
                  }}
                >
                  Clear
                </Button>
              </HStack>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AdminPortfolio;