import axios from "axios";
import { writeFileSync } from "fs";
import inquirer from "inquirer";

interface IVariant {
  syncVariant: number;
  size?: string;
  shoeSize?: number;
  color: string;
}

interface IProduct {
  syncProduct: number;
  variants: IVariant[];
}

const isShoeSize = (size: any) => {
  return !["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"].includes(
    size
  );
};

inquirer
  .prompt([
    {
      type: "input",
      name: "apikey",
      message: "What is your Printful API Key?"
    }
  ])
  .then(async ({ apikey }) => {
    let finalCatalogue = new Array<IProduct>();

    const options = {
      headers: {
        Authorization: `Bearer ${apikey}`
      }
    };

    console.log("Fetching products...");
    const {
      data: { result: products }
    } = await axios.get("https://api.printful.com/store/products", options);

    for (let product of products) {
      console.log(`Getting product ${product.id}...`);
      let catalogueProduct: IProduct;

      const {
        data: {
          result: { sync_variants: variants }
        }
      } = await axios.get(
        `https://api.printful.com/store/products/${product.id}`,
        options
      );

      catalogueProduct = {
        syncProduct: product.id,
        variants: []
      };

      for (let variant of variants) {
        console.log(variant.id);
        const {
          data: {
            result: {
              variant: { size, color }
            }
          }
        } = await axios.get(
          `https://api.printful.com/products/variant/${variant.product.variant_id}`,
          options
        );

        if (!isShoeSize(size)) {
          catalogueProduct.variants.push({
            syncVariant: variant.id,
            size,
            color: `${color}`.toLowerCase()
          });
        } else {
          catalogueProduct.variants.push({
            syncVariant: variant.id,
            shoeSize: Number.parseFloat(size),
            color: `${color}`.toLowerCase()
          });
        }
      }

      finalCatalogue.push(catalogueProduct);
    }

    console.log("Finished! Saving to catalogue.json");
    writeFileSync("catalogue.json", JSON.stringify(finalCatalogue));
  });
