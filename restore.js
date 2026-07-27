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

// Checkout
addToast("app/checkout/page.tsx", [
  [
    /if \(\!\/\^\\[A-Za-z\\\\s\\]\{3,60\}\\\$\/\.test\(trimmedName\)\) \{\s+return false;/g,
    'if (!/^[A-Za-z\\\\s]{3,60}$/.test(trimmedName)) {\n      toast.error("Enter a valid full name (letters and spaces only)");\n      return false;',
  ],
  [
    /if \(\!\/\^\\\\S\+\\@\\\\S\+\\\\\\.\\\\S\+\\\$\/\.test\(formData\.email\.trim\(\)\)\) \{\s+return false;/g,
    'if (!/^\\\\S+@\\\\S+\\\\.\\\\S+$/.test(formData.email.trim())) {\n      toast.error("Enter a valid email address");\n      return false;',
  ],
  [
    /if \(\!formData\.paymentProofUrl\) \{\s+return false;/g,
    'if (!formData.paymentProofUrl) {\n      toast.error("Upload the payment screenshot");\n      return false;',
  ],
  [
    /if \(\!items \|\| items\.length === 0\) \{\s+setIsSubmitting\(false\);/g,
    'if (!items || items.length === 0) {\n        toast.error("Your cart is empty");\n        setIsSubmitting(false);',
  ],
  [
    /console\.log\("Order created successfully:", res\.data\);\s+clearCart\(\);/g,
    'console.log("Order created successfully:", res.data);\n      toast.success("Order placed successfully!");\n      clearCart();',
  ],
]);

// ProductClient
addToast("app/products/[id]/ProductClient.tsx", [
  [
    /image: product\.images\[0\] \|\| "",\s+\}\);\s+to cart!`\);/g,
    'image: product.images[0] || "",\n    });\n    toast.success(`Added ${quantity} item(s) to cart!`);',
  ],
  [
    /await navigator\.clipboard\.writeText\(url\);\s+\} else \{/g,
    'await navigator.clipboard.writeText(url);\n        toast.success("Link copied");\n      } else {',
  ],
  [
    /document\.body\.removeChild\(textarea\);\s+\}\s+\} catch \(_err\) \{/g,
    'document.body.removeChild(textarea);\n        toast.success("Link copied");\n      }\n    } catch (_err) {\n      toast.error("Failed to copy link");',
  ],
]);

// Profile
addToast("app/profile/page.tsx", [
  [
    /if \(\!file\.type\.startsWith\("image\/"\)\) \{\s+return;/g,
    'if (!file.type.startsWith("image/")) {\n      toast.error("Please select an image file");\n      return;',
  ],
  [
    /await update\(\);\s+setIsDirty\(false\);/g,
    'await update();\n      setIsDirty(false);\n      toast.success("Profile picture updated!");',
  ],
  [
    /console\.error\("Upload error:", error\);\s+\} finally \{/g,
    'console.error("Upload error:", error);\n      toast.error("Failed to upload image");\n    } finally {',
  ],
  [
    /if \(\!isDirty\) return\s+setIsLoading\(true\);/g,
    'if (!isDirty) { toast("No changes to save"); return; }\n    setIsLoading(true);',
  ],
  [
    /if \(Object\.keys\(payload\)\.length === 0\) \{\s+setIsLoading\(false\);/g,
    'if (Object.keys(payload).length === 0) {\n        toast("No changes to save");\n        setIsLoading(false);',
  ],
  [
    /await axios\.put\("\/api\/user\/profile", payload\);\s+setInitialForm\(formData\);/g,
    'await axios.put("/api/user/profile", payload);\n      toast.success("Profile updated successfully!");\n      setInitialForm(formData);',
  ],
  [
    /console\.error\("Profile update error:", error\);\s+\} finally \{/g,
    'console.error("Profile update error:", error);\n      toast.error(error.response?.data?.error || "Failed to update profile");\n    } finally {',
  ],
]);

// ProductCard
addToast("components/ProductCard.tsx", [
  [
    /image: product\.images\[0\] \|\| "",\s+\}\)\s+\};/g,
    'image: product.images[0] || "",\n    });\n    toast.success("Added to cart!");\n  };',
  ],
  [
    /await navigator\.clipboard\.writeText\(url\);\s+return;\s+\}/g,
    'await navigator.clipboard.writeText(url);\n        toast.success("Link copied");\n        return;\n      }',
  ],
  [
    /document\.body\.removeChild\(textarea\);\s+\} catch \(_error\) \{/g,
    'document.body.removeChild(textarea);\n      toast.success("Link copied");\n    } catch (_error) {',
  ],
]);
