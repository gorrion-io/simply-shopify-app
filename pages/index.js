import { useEffect, useState } from "react";
import {
  Page,
  Card,
  CalloutCard,
  Layout,
  Heading,
  ResourceList,
  ResourceItem,
  Thumbnail,
  TextStyle,
  Loading,
  Frame,
} from "@shopify/polaris";
import { ImageMajor } from "@shopify/polaris-icons";
import { Toast, ResourcePicker, useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";

const useSettingsManagement = () => {
  const app = useAppBridge();
  const [isLoading, setIsLoading] = useState(true);
  const [isSetLoading, setIsSetLoading] = useState(false);
  const [settingsObj, setSettingsObj] = useState(undefined);
  const [error, setError] = useState(undefined);

  useEffect(() => {
    getSettings();
  }, []);

  const getSettings = async () => {
    setIsLoading(true);
    try {
      const token = await getSessionToken(app);
      const res = await fetch("/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const responseData = await res.json();
      if (responseData.status === "EMPTY_SETTINGS") {
        return;
      }

      if (responseData.status === "OK_SETTINGS") {
        setSettingsObj(responseData.data);
        return;
      }

      throw Error("Unknown settings status");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setSettings = async (productId) => {
    setIsSetLoading(true);
    try {
      const token = await getSessionToken(app);
      const res = await fetch("/settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "text/plain",
        },
        body: JSON.stringify({ productId }),
      });

      const responseData = await res.json();

      if (responseData.status === "OK_SETTINGS") {
        setSettingsObj(responseData.data);
      }

      throw Error("Unknown settings status");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSetLoading(false);
    }
  };

  const clearError = () => setError(undefined);

  return {
    settingsObj,
    isLoading,
    error,
    isSetLoading,
    setSettings,
    clearError,
  };
};

const Index = () => {
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [openResourcePicker, setOpenResourcePicker] = useState(false);
  const {
    settingsObj,
    isLoading,
    error,
    isSetLoading,
    setSettings,
    clearError,
  } = useSettingsManagement();

  const hideToast = () => setShowSuccessToast(false);
  const showToast = () => setShowSuccessToast(true);

  const hideResourcePicker = () => setOpenResourcePicker(false);
  const showResourcePicker = () => setOpenResourcePicker(true);

  const handleSelectProduct = async ({ selection }) => {
    if (selection.length === 0) return;
    await setSettings(selection[0].id);
    showToast();
    hideResourcePicker();
  };

  if (isLoading) {
    return (
      <Page>
        <div style={{ height: "100px" }}>
          <Frame>
            <Loading />
          </Frame>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Layout>
        <Layout.AnnotatedSection
          title="App settings"
          description="Set up the product you want to add to each customer's first order."
        >
          {settingsObj ? (
            <Card
              title={<Heading>Selected product</Heading>}
              primaryFooterAction={{
                content: "Select new product",
                onAction: showResourcePicker,
                loading: isSetLoading,
              }}
              footerActionAlignment="left"
              sectioned
            >
              <ResourceList
                resourceName={{ singular: "product", plural: "products" }}
                items={[settingsObj]}
                renderItem={(item) => {
                  const { id, title, image } = item;

                  return (
                    <ResourceItem
                      id={id}
                      media={
                        <Thumbnail
                          size="small"
                          source={image?.src || ImageMajor}
                          alt={`Product ${title} thumbnail`}
                        />
                      }
                      name={title}
                      verticalAlignment="center"
                    >
                      <h3>
                        <TextStyle variation="strong">{title}</TextStyle>
                      </h3>
                    </ResourceItem>
                  );
                }}
              />
            </Card>
          ) : (
            <CalloutCard
              title="Select your thanks product"
              illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
              primaryAction={{
                content: "Select product",
                onAction: showResourcePicker,
              }}
            >
              <p>You have not selected any product yet.</p>
            </CalloutCard>
          )}
        </Layout.AnnotatedSection>
      </Layout>

      <ResourcePicker
        resourceType="Product"
        open={openResourcePicker}
        onCancel={hideResourcePicker}
        onSelection={handleSelectProduct}
        allowMultiple={false}
        actionVerb="select"
      />
      {showSuccessToast && (
        <Toast content="Settings updated" onDismiss={hideToast} />
      )}

      {error && <Toast content={error} error onDismiss={clearError} />}
    </Page>
  );
};

export default Index;
