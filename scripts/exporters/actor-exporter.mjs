import { AbstractExporter } from './abstract-exporter.mjs';

export class ActorExporter extends AbstractExporter {
  static getDocumentData(indexDocument, document, customMapping) {
    const documentData = {
      name: indexDocument.name,
      description: document.system?.description?.value || "", // Use optional chaining and default to an empty string
      items: document.items.map(item => ({
        id: item._id,
        name: item.name,
        description: item.system?.description?.value || ""// Use optional chaining and default to an empty string
      }))
    };

    AbstractExporter._addCustomMapping(customMapping, indexDocument, documentData);

    return documentData;
  }

  async _processDataset() {
    const documents = await this.pack.getIndex({
      fields: [
        'prototypeToken.name',
        'system.description.value', // Ensure you add fields relevant for your custom mapping here
        ...Object.values(this.options.customMapping.actor).map((mapping) => mapping.value),
      ],
    });

    for (const indexDocument of documents) {
      const document = await this.pack.getDocument(indexDocument._id);
      let documentData = ActorExporter.getDocumentData(
        indexDocument,
        document,
        this.options.customMapping.actor,
      );

      // Process items with detailed information
      if (document.items.size) {
        documentData.items = document.items.map(item => ({
          id: item._id,
          name: item.name,
          description: item.system?.description?.value || "" // Ensure correct path based on your data structure
        }));
      }

      // Merge with existing content
      documentData = foundry.utils.mergeObject(documentData, this.existingContent[indexDocument.name] ?? {});

      // Store the processed data
      this.dataset.entries[indexDocument.name] = documentData;

      // Update the progress bar
      this._stepProgressBar();
    }
  }
}
