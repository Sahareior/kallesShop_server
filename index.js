const express = require('express')
const cors = require('cors')
const SSLCommerzPayment = require('sslcommerz-lts')
const app = express()
app.use(cors())
app.use(express.json());
const port = process.env.PORT || 5000; 

const store_id = 'testc64df3c78f3bc0'
const store_passwd = 'testc64df3c78f3bc0@ssl'
const is_live = false //true for live, false for sandbox
// shopping-store  wiettPtPC5wEEoxm

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://shopping-store:wiettPtPC5wEEoxm@cluster0.j0rll9s.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     client.connect();
    const productsCollections = client.db("Cloth-Store").collection("All-Products");
    const orderCollections = client.db("Cloth-Store").collection("Orders")
    // Send a ping to confirm a successful connection
    app.post('/payments', async (req, res) => {
      const body = req.body
     const items = req.body
     const phone = req.body.phone
     const trans_id= new ObjectId().toString()
      const data = {
        total_amount: body.total,
        currency: 'BDT',
        tran_id: trans_id, // use unique tran_id for each api call
        success_url: ` https://app-flame-five.vercel.app/payments/success/${trans_id}`,
        fail_url: 'http://localhost:3030/fail',
        cancel_url: 'http://localhost:3030/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: body.name,
        cus_email: body.email,
        cus_add1: body.address,
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: phone,
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };
    
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
      sslcz.init(data).then(apiResponse => {
          // Redirect the user to payment gateway
          let GatewayPageURL = apiResponse.GatewayPageURL
          res.send({url:GatewayPageURL})
          const date = new Date()
          const day = date.toLocaleString()
          const day_date = date.toDateString()
          
// lll
          const paymentData = {
            data,
            transection_id : trans_id,
            paid: false,
            orderdItem: items,
            orderdTime: day,
            orderDate: day_date
          }
console.log(paymentData)
          const result =  orderCollections.insertOne(paymentData)
          
      });
      
  })

  app.post('/payments/success/:transID', async (req, res) => {
    const trans_id = req.params.transID;
    const result = await orderCollections.updateOne(
  { transection_id: trans_id},
  {
    $set:{paid:true}
  }
)

if(result.modifiedCount>0){
  res.redirect('https://mellifluous-starship-c61165.netlify.app/payments/success')
}


  });


  app.get('/orders', async (req, res) => {
    const { date } = req.query;
  console.log(req.query)
    let query = {};
    if (date) {
      query.orderDate = date;
    }
  
    const cursor = orderCollections.find(query);

    // Sort the results in ascending order by the 'orderdTime' field
    cursor.sort({ orderdTime: -1 });
  
    const result = await cursor.toArray();
  
    res.send(result);
  });
  
  app.get('/allproducts', async (req, res) => {
    const { size, color, brand, category,gender } = req.query;
   
    let query = {}; // Initial query object
  
    if (size) {
      query.size = size;
    }
  
    if (color) {
      query.color = color;
    }
  
    if (brand) {
      query.brand = brand;
    }
    if(category){
      query.category = category
    }
    if(gender){
      query.gender = gender
    }
    console.log(query)
    try {
      // Use your Product model to fetch data based on the query
      // Replace "Product" with your actual MongoDB model
      const products = await productsCollections.find(query).toArray();
      
      // Return the filtered products as a response
      res.send(products);
  
    
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching products.' });
    }
  });
  
  
    app.get('/products', async (req,res)=>{
        const cursor = productsCollections.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/products/:id', async(req,res)=>{
        const id = req.params.id 
        const query = {_id: new ObjectId(id)}
        const cursor = productsCollections.find(query)
        const result = await cursor.toArray()
        res.send(result)
    })

    app.delete('/products/:id', async(req,res)=>{
        const id = req.params.id 
      
        const query = {_id: new ObjectId(id)}
        const result = await productsCollections.deleteOne(query)
        res.send(result)
    })

    app.patch('/products/:id', async(req,res)=>{
      const id = req.params.id 
      const data = req.body
      const querry = {_id: new ObjectId(id)}
      console.log(data)
      let updateData
      if(data.name == 'highlighted'){
       updateData = {
        $set: {
          highlighted: data.data,
        }
       }
      }
      else if(data.name =='hotdeals'){
        updateData = {
          $set: {
            hotDeals: data.data,
          }
         }
      }
      else if (data.name == 'newly'){
        updateData = {
          $set: {
            newlyArrived: data.data,
          }
         }
      }
      else if (data.name == 'bestsells'){
        updateData = {
          $set: {
            bestSells: data.data,
          }
         }
      }
    
      const result = await productsCollections.updateOne(querry,updateData)
      res.send(result)
   
    })

    app.put('/products/:id', async (req,res)=>{
      const id = req.params.id 
      const data = req.body 
      const query = {_id: new ObjectId(id)}
      const updatedData ={
        $set:{
          price: data.price,
          category: data.category,
          email: data.email,
          img: data.img,
          img2: data.img2,
          zoomImage: data.zoomImage,
          color: data.color,
          gender: data.gender,
          title: data.title
        }
      }
      const result = await productsCollections.updateOne(query,updatedData)
      res.send(result)
    })

    app.post('/products', async(req,res)=>{
      const data = req.body
     const newData ={
      
       
        gender: data.gender,
        category: data.category,
        title: data.title,
        hotDeals: "no",
        bestSells: "no",
        newlyArrived: "yes",
        highlighted: "no",
        price: data.price,
        size:data.Psize,
        brand:data.PBrand,
        img: data.img,
        img2: data.img2,
        zoomImage: data.zoomImage,
        date: data.date,
        color: data.color,
        id: data.id
     }
     const result = await productsCollections.insertOne(newData);
     res.send(result);
  
    })
 
    app.post('/orders',async (req,res)=>{
      const data = req.body
      console.log(data)
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=> {
    res.send('Hello Pithibi')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});