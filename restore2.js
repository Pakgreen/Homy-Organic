const fs = require("fs");

function addToast(file, replacements) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes('import { toast } from "sonner"')) {
    content = content.replace(
      /(import .*?;)/,
      '$1\nimport { toast } from "sonner";',
    );
  }
  replacements.forEach(([search, replace]) => {
    content = content.replace(search, replace);
  });
  fs.writeFileSync(file, content);
  console.log("Updated", file);
}

// Categories
addToast("app/admin/categories/page.tsx", [
  [
    /catch \(error\) \{\s+\}/g,
    'catch (error) {\n      toast.error("Failed");\n    }',
  ],
  [
    /await axios\.post\("\/api\/categories", formData\);\s+\}/g,
    'await axios.post("/api/categories", formData);\n        toast.success("Category created successfully");\n      }',
  ],
  [
    /await axios\.put\(`\/api\/categories\/\$\{editingCategory\._id\}`\, formData\);\s+\} else/g,
    'await axios.put(`/api/categories/${editingCategory._id}`, formData);\n        toast.success("Category updated successfully");\n      } else',
  ],
  [
    /catch \(error: any\) \{\s+\}/g,
    'catch (error: any) {\n      toast.error(error.response?.data?.error || "Failed to save");\n    }',
  ],
  [
    /await axios\.delete\(`\/api\/categories\/\$\{id\}`\);\s+fetchCategories\(\);/g,
    'await axios.delete(`/api/categories/${id}`);\n      toast.success("Category deleted");\n      fetchCategories();',
  ],
]);

// Sliders
addToast("app/admin/sliders/page.tsx", [
  [
    /catch \(error\) \{\s+\}/g,
    'catch (error) {\n      toast.error("Failed");\n    }',
  ],
  [
    /await axios\.post\("\/api\/sliders", formData\);\s+\}/g,
    'await axios.post("/api/sliders", formData);\n        toast.success("Created successfully");\n      }',
  ],
  [
    /await axios\.put\(`\/api\/sliders\/\$\{editingSlider\._id\}`\, formData\);\s+\} else/g,
    'await axios.put(`/api/sliders/${editingSlider._id}`, formData);\n        toast.success("Updated successfully");\n      } else',
  ],
  [
    /catch \(error: any\) \{\s+\}/g,
    'catch (error: any) {\n      toast.error(error.response?.data?.error || "Failed");\n    }',
  ],
  [
    /await axios\.delete\(`\/api\/sliders\/\$\{id\}`\);\s+fetchSliders\(\);/g,
    'await axios.delete(`/api/sliders/${id}`);\n      toast.success("Deleted");\n      fetchSliders();',
  ],
]);

// Products
addToast("app/admin/products/page.tsx", [
  [
    /await axios\.post\("\/api\/products", finalData\);\s+\}/g,
    'await axios.post("/api/products", finalData);\n        toast.success("Created successfully");\n      }',
  ],
  [
    /await axios\.put\(`\/api\/products\/\$\{editingProduct\._id\}`\, finalData\);\s+\} else/g,
    'await axios.put(`/api/products/${editingProduct._id}`, finalData);\n        toast.success("Updated successfully");\n      } else',
  ],
  [
    /await axios\.delete\(`\/api\/products\/\$\{id\}`\);\s+fetchProducts\(\);/g,
    'await axios.delete(`/api/products/${id}`);\n      toast.success("Deleted");\n      fetchProducts();',
  ],
]);
