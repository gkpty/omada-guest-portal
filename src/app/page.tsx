import PortalForm from "@/components/portalForm";

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const sParams = await searchParams;
  return (
    <>
      <PortalForm
        clientMac={sParams?.clientMac || ''}
        apMac={sParams?.apMac || ''}
        redirectUrl={sParams?.redirectUrl || ''}
        ssidName={sParams?.ssidName as string | undefined}
        radioId={sParams?.radioId as string | undefined}
        site={sParams?.site as string | undefined}
      />
    </>
  );
}
