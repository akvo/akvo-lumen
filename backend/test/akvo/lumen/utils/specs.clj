(ns akvo.lumen.utils.specs
  (:require [potemkin :refer [import-vars]]))

(import-vars
 [akvo.lumen.specs.config]
 [akvo.lumen.specs.core sample]
 [akvo.lumen.specs.db]
 [akvo.lumen.specs.libs]
 [akvo.lumen.specs.transformations]
 [akvo.lumen.specs.aggregation]
 [akvo.lumen.specs.dataset])
