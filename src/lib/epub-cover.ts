import AdmZip from 'adm-zip';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

interface CoverInfo {
  coverBuffer: Buffer | null;
  mimeType: string | null;
}

export async function extractEpubCover(epubBuffer: Buffer): Promise<CoverInfo> {
  try {
    const zip = new AdmZip(epubBuffer);
    const entries = zip.getEntries();
    
    // First, try to find cover from container.xml
    const containerEntry = entries.find((entry: AdmZip.IZipEntry) => 
      entry.entryName === 'META-INF/container.xml'
    );
    
    if (!containerEntry) {
      return { coverBuffer: null, mimeType: null };
    }

    const containerXml = containerEntry.getData().toString('utf8');
    const container = await parseXML(containerXml) as any;
    
    const rootfilePath = container?.container?.rootfiles?.[0]?.rootfile?.[0]?.$?.['full-path'];
    if (!rootfilePath) {
      return { coverBuffer: null, mimeType: null };
    }

    // Parse the OPF file (content.opf or similar)
    const opfEntry = entries.find((entry: AdmZip.IZipEntry) => entry.entryName === rootfilePath);
    if (!opfEntry) {
      return { coverBuffer: null, mimeType: null };
    }

    const opfXml = opfEntry.getData().toString('utf8');
    const opf = await parseXML(opfXml) as any;
    
    const manifest = opf?.package?.manifest?.[0]?.item || [];
    const metadata = opf?.package?.metadata?.[0];
    
    // Method 1: Look for cover in metadata
    let coverId: string | null = null;
    
    // Check for cover in meta tags
    const metaTags = metadata?.meta || [];
    for (const meta of metaTags) {
      if (meta.$?.name === 'cover' && meta.$?.content) {
        coverId = meta.$.content;
        break;
      }
    }
    
    // Method 2: Look for items with properties="cover-image"
    if (!coverId) {
      const coverItem = manifest.find((item: any) => 
        item.$?.properties?.includes('cover-image') ||
        item.$?.id?.toLowerCase().includes('cover')
      );
      if (coverItem) {
        coverId = coverItem.$.id;
      }
    }
    
    // Method 3: Look for common cover filenames
    if (!coverId) {
      const commonCoverNames = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.gif'];
      const coverItem = manifest.find((item: any) => {
        const href = item.$?.href?.toLowerCase() || '';
        return commonCoverNames.some((name: string) => href.includes(name));
      });
      if (coverItem) {
        coverId = coverItem.$.id;
      }
    }
    
    if (!coverId) {
      return { coverBuffer: null, mimeType: null };
    }
    
    // Find the actual file path
    const coverManifestItem = manifest.find((item: any) => item.$.id === coverId);
    if (!coverManifestItem) {
      return { coverBuffer: null, mimeType: null };
    }
    
    const coverHref = coverManifestItem.$.href;
    const mimeType = coverManifestItem.$['media-type'] || 'image/jpeg';
    
    // Resolve the path relative to OPF file
    const opfDir = rootfilePath.substring(0, rootfilePath.lastIndexOf('/') + 1);
    const fullCoverPath = opfDir + coverHref;
    
    // Extract the cover image
    const coverEntry = entries.find((entry: AdmZip.IZipEntry) => 
      entry.entryName === fullCoverPath || 
      entry.entryName === coverHref
    );
    
    if (!coverEntry) {
      return { coverBuffer: null, mimeType: null };
    }
    
    return {
      coverBuffer: coverEntry.getData(),
      mimeType: mimeType
    };
    
  } catch (error) {
    console.error('Error extracting EPUB cover:', error);
    return { coverBuffer: null, mimeType: null };
  }
}